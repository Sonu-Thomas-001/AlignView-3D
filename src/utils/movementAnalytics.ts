import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { STLFileInfo } from '@/types/dental';

/**
 * Measured stage-to-stage tooth movement for a clear-aligner STL sequence.
 *
 * Every stage of one arch is exported by the CAD tool in the same coordinate frame
 * with the model base fixed and only the teeth moved, and the import pipeline places
 * them all with one shared transform (see `computeDentalNormalization`). That makes the
 * meshes directly comparable, so movement can be measured from the surfaces themselves
 * rather than inferred from whole-arch summary statistics.
 *
 * Stages are re-tessellated independently, so vertex counts differ between stages and
 * there is no vertex-to-vertex correspondence. Displacement is therefore measured as
 * the distance from each sampled point on one stage's crown surface to the nearest
 * point on the other stage's triangle surface, via a bounding volume hierarchy.
 * Distance to the nearest triangle rather than the nearest vertex matters here: vertex
 * distance carries a positive bias of roughly half the local vertex spacing, which on
 * these meshes is the same order as a single stage's movement, so it reads coarser
 * stages as having moved further than they did.
 *
 * What this deliberately does NOT claim: per-tooth translation and rotation. That needs
 * tooth segmentation, which this pipeline does not perform. A whole-arch centroid shift
 * is not a substitute - on the sample case it reports sub-millimetre noise from
 * base-trim differences as if it were tooth movement, and flags a third of the
 * clinically normal stages as over budget.
 */

/** Past this distance a sampled point is treated as having no counterpart. */
const MAX_SEARCH_MM = 6;
/** Below this a sampled point is treated as unmoved; it is within tessellation noise. */
const MOVEMENT_FLOOR_MM = 0.05;

/**
 * One bounding volume hierarchy per stage geometry, for nearest-surface queries.
 *
 * Building a hierarchy over a full-resolution stage (around 880,000 vertices) takes
 * roughly 100 ms, so it is cached against the geometry object and reused for every
 * comparison that stage takes part in, as well as by hover picking.
 */
const bvhCache = new WeakMap<THREE.BufferGeometry, MeshBVH>();

function bvhFor(geometry: THREE.BufferGeometry): MeshBVH {
  let bvh = bvhCache.get(geometry);
  if (!bvh) {
    bvh = new MeshBVH(geometry, { maxLeafTris: 12 });
    bvhCache.set(geometry, bvh);
  }
  return bvh;
}

// Reused across queries; nearest-surface lookups run hundreds of thousands of times
// when building a heat map, and allocating a hit record per call dominates the cost.
const queryPoint = new THREE.Vector3();
const hitRecord = { point: new THREE.Vector3(), distance: 0, faceIndex: -1 };

/**
 * Distance from a point to the nearest triangle of `bvh`, or `Infinity` when nothing
 * lies within `MAX_SEARCH_MM`. Both must be in the same coordinate frame.
 */
function surfaceDistance(bvh: MeshBVH, x: number, y: number, z: number): number {
  queryPoint.set(x, y, z);
  const hit = bvh.closestPointToPoint(queryPoint, hitRecord, 0, MAX_SEARCH_MM);
  return hit ? hit.distance : Infinity;
}

/**
 * Y coordinate separating crowns from the gingiva and model base.
 *
 * Upper arches are placed crowns-down and lower arches crowns-up, so the occlusal
 * extreme is the min or max of Y respectively. The band is measured inward from there.
 * Restricting to crowns keeps the reading about teeth: the base is identical between
 * stages and would otherwise dilute every average toward zero.
 */
function crownCutoffY(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
): { cutoff: number; keepBelow: boolean } {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const height = box.max.y - box.min.y;
  const band = Math.max(6, height * 0.55);

  return arch === 'upper'
    ? { cutoff: box.min.y + band, keepBelow: true }
    : { cutoff: box.max.y - band, keepBelow: false };
}

export interface CrownDisplacement {
  /** Mean displacement over sampled crown points, in mm. */
  meanMm: number;
  /** Median displacement, in mm. Robust to trim-edge outliers. */
  medianMm: number;
  p95Mm: number;
  /**
   * 99.5th percentile displacement, reported as the effective maximum. The true
   * maximum is dominated by the open trim border of the scan shell, where a point on
   * one stage may have no counterpart on the other.
   */
  maxMm: number;
  /** Share of sampled crown points that moved more than the noise floor. */
  movingFraction: number;
  sampleCount: number;
}

function percentile(sorted: Float64Array, q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[idx];
}

/**
 * Measures how far the crown surfaces moved between two stages of the same arch.
 * Both geometries must already be placed in their arch's shared reference frame.
 */
export function computeCrownDisplacement(
  fromGeometry: THREE.BufferGeometry,
  toGeometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
  sampleTarget = 20000,
): CrownDisplacement | null {
  const pos = toGeometry.attributes.position;
  if (!pos || pos.count === 0) return null;

  const { cutoff, keepBelow } = crownCutoffY(toGeometry, arch);
  const bvh = bvhFor(fromGeometry);

  // Count crown candidates first so the stride lands near the sample target.
  let candidates = 0;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (keepBelow ? y <= cutoff : y >= cutoff) candidates++;
  }
  if (candidates === 0) return null;

  const stride = Math.max(1, Math.floor(candidates / sampleTarget));
  const distances = new Float64Array(Math.ceil(candidates / stride));
  let seen = 0;
  let written = 0;
  let sum = 0;
  let moving = 0;

  for (let i = 0; i < pos.count && written < distances.length; i++) {
    const y = pos.getY(i);
    if (keepBelow ? y > cutoff : y < cutoff) continue;
    if (seen++ % stride !== 0) continue;

    const d = surfaceDistance(bvh, pos.getX(i), y, pos.getZ(i));
    if (!Number.isFinite(d)) continue;

    distances[written++] = d;
    sum += d;
    if (d > MOVEMENT_FLOOR_MM) moving++;
  }

  if (written === 0) return null;

  const sorted = Float64Array.from(distances.subarray(0, written)).sort();

  return {
    meanMm: sum / written,
    medianMm: percentile(sorted, 0.5),
    p95Mm: percentile(sorted, 0.95),
    maxMm: percentile(sorted, 0.995),
    movingFraction: moving / written,
    sampleCount: written,
  };
}

export interface StageMovementMetrics {
  stage: number;
  /** Stage the measurement is relative to, or null when there is nothing to compare. */
  fromStage: number | null;
  upper: CrownDisplacement | null;
  lower: CrownDisplacement | null;
  /** Larger of the two arches' effective maximum crown displacement, in mm. */
  maxMm: number;
  /**
   * Larger of the two arches' 95th-percentile crown displacement, in mm. This is the
   * figure to judge a per-stage movement budget against: the peak is a single local
   * spot, which on a real case is often a composite attachment appearing or
   * interproximal reduction rather than the arch as a whole stepping further.
   */
  p95Mm: number;
  /** Larger of the two arches' mean crown displacement, in mm. */
  meanMm: number;
  dominantArch: string;
  /** False when geometry for one of the two stages was unavailable. */
  isMeasured: boolean;
  message: string;
}

function fileAtStage(files: STLFileInfo[], stage: number): STLFileInfo | undefined {
  const exact = files.filter(f => f.stage === stage);
  if (exact.length === 0) return undefined;
  return exact.find(f => !f.isTemplate) ?? exact[0];
}

function fileBeforeStage(files: STLFileInfo[], stage: number): STLFileInfo | undefined {
  const earlier = files
    .filter(f => (f.stage ?? 0) < stage)
    .sort((a, b) => (b.stage ?? 0) - (a.stage ?? 0));
  if (earlier.length === 0) return undefined;
  const best = earlier[0].stage;
  const atBest = earlier.filter(f => f.stage === best);
  return atBest.find(f => !f.isTemplate) ?? atBest[0];
}

function firstStageFile(files: STLFileInfo[]): STLFileInfo | undefined {
  if (files.length === 0) return undefined;
  const lowest = files.reduce((min, f) => Math.min(min, f.stage ?? 1), Infinity);
  return fileAtStage(files, lowest) ?? files[0];
}

const resultCache = new Map<string, CrownDisplacement | null>();

function displacementBetween(
  arch: 'upper' | 'lower',
  fromFile: STLFileInfo | undefined,
  toFile: STLFileInfo | undefined,
): CrownDisplacement | null {
  if (!fromFile?.customBufferGeometry || !toFile?.customBufferGeometry) return null;
  if (fromFile.id === toFile.id) return null;
  // A stage placed outside its arch's shared frame is not comparable with the rest.
  if (fromFile.usesSharedFrame === false || toFile.usesSharedFrame === false) return null;

  const key = `${arch}:${fromFile.id}->${toFile.id}`;
  const cached = resultCache.get(key);
  if (cached !== undefined) return cached;

  const result = computeCrownDisplacement(
    fromFile.customBufferGeometry,
    toFile.customBufferGeometry,
    arch,
  );
  resultCache.set(key, result);
  return result;
}

/**
 * Crown movement between `stage` and the previous stage present in each arch sequence.
 * Set `relativeToStart` to measure the total correction achieved since stage 1 instead.
 */
export function computeStageMovement(
  upperFiles: STLFileInfo[],
  lowerFiles: STLFileInfo[],
  stage: number,
  relativeToStart = false,
): StageMovementMetrics {
  const upperTo = fileAtStage(upperFiles, stage);
  const lowerTo = fileAtStage(lowerFiles, stage);

  const pickFrom = (files: STLFileInfo[]) =>
    (relativeToStart ? firstStageFile(files) : fileBeforeStage(files, stage));

  const upperFrom = pickFrom(upperFiles);
  const lowerFrom = pickFrom(lowerFiles);

  const upper = displacementBetween('upper', upperFrom, upperTo);
  const lower = displacementBetween('lower', lowerFrom, lowerTo);

  const fromStage = upper ? upperFrom?.stage ?? null : lower ? lowerFrom?.stage ?? null : null;

  if (!upper && !lower) {
    return {
      stage,
      fromStage: null,
      upper: null,
      lower: null,
      maxMm: 0,
      p95Mm: 0,
      meanMm: 0,
      dominantArch: 'N/A',
      isMeasured: false,
      message: stage <= 1
        ? 'Stage 1 is the starting position, so there is nothing to compare it against.'
        : 'No comparable earlier stage is loaded for this arch, so movement cannot be measured.',
    };
  }

  const upperMax = upper?.maxMm ?? 0;
  const lowerMax = lower?.maxMm ?? 0;
  const maxMm = Math.max(upperMax, lowerMax);
  const p95Mm = Math.max(upper?.p95Mm ?? 0, lower?.p95Mm ?? 0);
  const meanMm = Math.max(upper?.meanMm ?? 0, lower?.meanMm ?? 0);
  const dominantArch = upperMax >= lowerMax ? 'Upper arch' : 'Lower arch';

  const scope = relativeToStart ? `since stage ${fromStage}` : `from stage ${fromStage}`;
  const message = maxMm < MOVEMENT_FLOOR_MM
    ? `Crown surfaces are unchanged ${scope}. This stage holds the previous position.`
    : `Measured from the crown surfaces ${scope}. Peak is the 99.5th percentile, which ignores scan trim edges.`;

  return { stage, fromStage, upper, lower, maxMm, p95Mm, meanMm, dominantArch, isMeasured: true, message };
}

/**
 * How far one surface point moved, for the hover readout: the distance from a point on
 * the current stage's surface to the nearest point on the comparison stage's surface.
 * The point must be in the mesh's own coordinates, not world coordinates.
 *
 * Returns null when there is no comparable stage, or when the point has no counterpart
 * within the grid's search radius (which happens at the open trim border of the shell).
 */
export function localDisplacementAt(
  files: STLFileInfo[],
  arch: 'upper' | 'lower',
  stage: number,
  localPoint: { x: number; y: number; z: number },
  relativeToStart = false,
): { displacementMm: number; fromStage: number } | null {
  const toFile = fileAtStage(files, stage);
  const fromFile = relativeToStart ? firstStageFile(files) : fileBeforeStage(files, stage);

  if (!fromFile?.customBufferGeometry || !toFile?.customBufferGeometry) return null;
  if (fromFile.id === toFile.id) return null;
  if (fromFile.usesSharedFrame === false || toFile.usesSharedFrame === false) return null;

  const d = surfaceDistance(
    bvhFor(fromFile.customBufferGeometry),
    localPoint.x,
    localPoint.y,
    localPoint.z,
  );
  if (!Number.isFinite(d)) return null;

  return { displacementMm: d, fromStage: fromFile.stage };
}

/** Teal to red ramp for displacement magnitude. */
function rampColor(t: number, out: THREE.Color): THREE.Color {
  const clamped = Math.min(1, Math.max(0, t));
  if (clamped <= 0.5) {
    const u = clamped * 2;
    return out.setRGB(0.13 + u * 0.8, 0.55 + u * 0.17, 0.75 - u * 0.6);
  }
  const u = (clamped - 0.5) * 2;
  return out.setRGB(0.93, 0.72 - u * 0.58, 0.15 * (1 - u));
}

/** Scene-facing colour key for the heat map legend, matching `rampColor`. */
export const MOVEMENT_LEGEND = [
  { label: 'No change', color: '#C7CCD6' },
  { label: 'Slight', color: '#218CBF' },
  { label: 'Moderate', color: '#EEB826' },
  { label: 'Largest', color: '#ED2426' },
];

/**
 * Per-vertex displacement colours for the movement heat map, covering the whole mesh
 * (not just the crowns) so the static base reads as unchanged rather than as missing.
 * Returns null when the target geometry has no vertices.
 */
export function computeDisplacementColors(
  fromGeometry: THREE.BufferGeometry,
  toGeometry: THREE.BufferGeometry,
  scaleMm: number,
): Float32Array | null {
  const pos = toGeometry.attributes.position;
  if (!pos || pos.count === 0) return null;

  const bvh = bvhFor(fromGeometry);
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();
  const span = Math.max(0.1, scaleMm);

  for (let i = 0; i < pos.count; i++) {
    const d = surfaceDistance(bvh, pos.getX(i), pos.getY(i), pos.getZ(i));
    if (!Number.isFinite(d) || d <= MOVEMENT_FLOOR_MM) {
      color.setRGB(0.78, 0.80, 0.84);
    } else {
      rampColor(d / span, color);
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return colors;
}

/** Clears memoised displacement results. Call when the loaded case is replaced. */
export function clearMovementCache(): void {
  resultCache.clear();
}
