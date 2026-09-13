import * as THREE from 'three';
import { ensureBoundsTree } from './meshBvh';

export interface OcclusionOffset {
  dx: number;
  dy: number;
  dz: number;
  /** Rotation to apply to the lower arch about X (tips front/back, corrects Curve-of-Spee mismatch). */
  pitchRad: number;
  /** Rotation to apply to the lower arch about Z (tips left/right, corrects arch-width/curvature mismatch). */
  rollRad: number;
  /** Cells seated within `CONTACT_BAND_MM` of touching - how broadly the bite actually contacts. */
  contactCells: number;
  /**
   * Deepest interpenetration the seat allows, in mm. Zero means no crown passes through the
   * opposing arch; a few tenths is a light contact facet. A large value means the arches are
   * being drawn merged into one another, which is what this registration exists to avoid.
   */
  penetrationMm: number;
  /** Std. deviation of clearance across the occluding band, in mm - lower means a more even bite. */
  residualStdMm: number;
}

/** Normal Class I overjet: the lower arch sits this far posterior to the upper. */
const OVERJET_MM = 2.0;

/** Footprint cell for the closest-approach envelope. About one cusp slope wide. */
const CELL_MM = 2.0;

/**
 * Grid the cast candidates are chosen on, in mm.
 *
 * One candidate per cell, the highest crown point in it, because the highest point of a small
 * patch is the one that meets the opposing arch first. Choosing them by position rather than
 * by taking every n-th vertex is what makes the registration reproducible: the order the
 * vertices happen to be in is not a property of the patient, and it changes under things as
 * unrelated as a bounding hierarchy having been built over the mesh.
 *
 * The size is set by how much the seat moves when an already-seated arch is registered again,
 * which should be nothing. Coarse cells leave the answer sensitive to where the grid falls
 * across a cusp: re-registering asks for another 0.13 mm at 2 mm cells and 0.20 mm at 1 mm,
 * against 0.002 mm here. Below this it stops improving and only costs casts.
 */
const CANDIDATE_CELL_MM = 0.4;

/** Tilt refinement passes. The fit is converged after two on real cases; a third moves it <0.05mm. */
const TILT_PASSES = 2;

/**
 * Ceiling on the corrective tilt. Two arches scanned and normalised separately differ by a
 * degree or two of occlusal-plane orientation, which is what this corrects. Anything larger
 * is a bad fit rather than a real discrepancy, and tipping an arch six degrees to chase it
 * would look worse than the mismatch it was trying to remove.
 */
const MAX_TILT_RAD = THREE.MathUtils.degToRad(6);

/** Below this the arches barely face each other and there is nothing to fit. */
const MIN_ENVELOPE_CELLS = 20;

/** Cells this close to touching are counted and reported as the contact. */
const CONTACT_BAND_MM = 0.5;

/** Clearance within this of contact is the occluding band, over which evenness is measured. */
const OCCLUDING_BAND_MM = 3.0;

/**
 * How far down the sorted closest-approach list to seat.
 *
 * Seating on the outright minimum lets one cell decide the bite for the whole arch, and a
 * single scanner spike or sliver triangle on a cusp tip would then hold the whole occlusion
 * open by its own height. Seating a little way in requires the contact to be corroborated by
 * other cells; the cost is that the cells ahead of it interpenetrate, which is why the depth
 * is measured and reported rather than assumed to be negligible. On real cases this is a
 * few tenths of a millimetre.
 */
const SEAT_PERCENTILE = 0.01;
/** Never seat before this index, so a lone tight cell cannot set the bite on a small footprint. */
const SEAT_INDEX_FLOOR = 2;

/**
 * Registrations already computed, keyed on the pair of geometries.
 *
 * A registration is around a quarter of a second, and it is asked for again every time either
 * arch changes stage - so dragging the stage slider back and forth would otherwise re-derive
 * the same bites over and over. Both keys are weak, so nothing here outlives the geometry it
 * describes. Relies on stage geometries being read-only once imported, which is the same
 * assumption `ensureBoundsTree` already makes by caching a hierarchy against a geometry.
 */
const registrations = new WeakMap<
  THREE.BufferGeometry,
  WeakMap<THREE.BufferGeometry, OcclusionOffset>
>();

/** One closest-approach reading per footprint cell. */
interface EnvelopeCell {
  x: number;
  z: number;
  /** Clearance straight up from the lower surface to the upper, in mm. Never negative. */
  gap: number;
}

/**
 * Points on the lower crowns to cast from: the highest one in each footprint cell.
 *
 * Crowns only. The gingival flanges of the two arches are the same vestibular soft tissue
 * captured twice, once per scan, so in a correct bite they genuinely overlap - constraining
 * the seat by them would hold the teeth apart by however much gum each scan happened to
 * catch. Segmentation puts the crown triangles first, so the crown range is the leading
 * `toothTriangles` of the draw order; without a split every triangle is used, which is more
 * conservative.
 *
 * Draw order means the index when the geometry has one, and whether it has one is not fixed:
 * building a bounding volume hierarchy over a non-indexed geometry gives it an index as a
 * side effect. So this reads through the index if it is there, and picks its candidates by
 * position rather than by taking every n-th vertex. Both matter. Testing for an index and
 * falling back to the whole mesh made the bite seat on gum, and only on the stages something
 * had already been measured or picked against; striding then made the answer wander by a
 * fifth of a millimetre when the hierarchy reordered that index. Neither is a difference a
 * provider could explain, and both showed up as the same case seating two ways.
 *
 * A full sweep of the crowns costs an integer division and a compare per vertex - cheap next
 * to the casts it feeds, and it replaces a few thousand casts at arbitrary points with about
 * two thousand at exactly the points that can touch.
 */
function crownSamples(lower: THREE.BufferGeometry): Float32Array {
  const position = lower.attributes.position;
  const index = lower.index;
  const split = lower.userData.toothGumSplit as { toothTriangles: number } | undefined;
  const triangles = Math.floor((index ? index.count : position.count) / 3);
  const crownTriangles = split ? Math.min(triangles, split.toothTriangles) : triangles;

  // Cell keys are packed into one number; the stride is far wider than any arch is in cells,
  // so no two cells can collide on it.
  const columns = 4096;
  const highest = new Map<number, number>();

  for (let corner = 0; corner < crownTriangles * 3; corner++) {
    const vertex = index ? index.getX(corner) : corner;
    const x = position.getX(vertex);
    const y = position.getY(vertex);
    const z = position.getZ(vertex);
    const key = Math.round(x / CANDIDATE_CELL_MM) * columns + Math.round(z / CANDIDATE_CELL_MM);
    const previous = highest.get(key);
    if (previous === undefined || y > position.getY(previous)) highest.set(key, vertex);
  }

  const samples = new Float32Array(highest.size * 3);
  let write = 0;
  for (const vertex of highest.values()) {
    samples[write++] = position.getX(vertex);
    samples[write++] = position.getY(vertex);
    samples[write++] = position.getZ(vertex);
  }
  return samples;
}

/**
 * Closest approach from the lower arch up to the upper, per footprint cell.
 *
 * The lower is first dropped clear of the upper altogether, then every sample is asked how
 * far it may rise before it meets the upper surface. Starting from a provably separated pose
 * is what makes the reading meaningful: from anywhere else a sample could already be inside
 * the upper shell, and a ray cast from in there measures the distance out of it instead.
 *
 * This replaced a height-map difference - the upper's lowest point against the lower's
 * highest, per cell - which cannot tell "below the upper's lowest surface" from "inside the
 * upper". Those are the same reading for a normal overbite, where the upper incisors sit
 * below the lower ones and 6 mm in front, and reading them as interpenetration drove the
 * whole arch several millimetres into its opponent.
 */
function clearanceEnvelope(
  upper: THREE.BufferGeometry,
  samples: Float32Array,
  pitchRad: number,
  rollRad: number,
): { cells: EnvelopeCell[]; baseY: number } {
  // `upper.boundingBox` is the caller's responsibility: this runs once per refinement pass,
  // and recomputing it over a few hundred thousand vertices each time is pure waste.
  const bvh = ensureBoundsTree(upper);

  // Matches how the offset is applied downstream: rotate about X, then about Z, then translate.
  const rotation = new THREE.Matrix4()
    .makeRotationZ(rollRad)
    .multiply(new THREE.Matrix4().makeRotationX(pitchRad));

  const point = new THREE.Vector3();
  let topY = -Infinity;
  for (let i = 0; i < samples.length; i += 3) {
    point.set(samples[i], samples[i + 1], samples[i + 2]).applyMatrix4(rotation);
    if (point.y > topY) topY = point.y;
  }
  // Every sample now starts at or below the upper's lowest point, so none of them can be
  // inside it, whatever the two shapes are.
  const baseY = upper.boundingBox!.min.y - topY;

  const ray = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
  const cells = new Map<number, EnvelopeCell>();
  const columns = 4096;

  for (let i = 0; i < samples.length; i += 3) {
    point.set(samples[i], samples[i + 1], samples[i + 2]).applyMatrix4(rotation);
    ray.origin.set(point.x, point.y + baseY, point.z - OVERJET_MM);

    // Double-sided because STL winding cannot be relied on, and any surface above the sample
    // is something it would run into.
    const hit = bvh.raycastFirst(ray, THREE.DoubleSide);
    if (!hit) continue;

    const key = Math.round(ray.origin.x / CELL_MM) * columns + Math.round(ray.origin.z / CELL_MM);
    const existing = cells.get(key);
    if (!existing || hit.distance < existing.gap) {
      cells.set(key, { x: ray.origin.x, z: ray.origin.z, gap: hit.distance });
    }
  }

  return { cells: [...cells.values()], baseY };
}

/**
 * Least-squares fit of gap(x, z) = a + bx*x + bz*z over the closest-approach cells. A single
 * rigid Y-shift can only bring ONE point of the arch into contact; real upper/lower arches
 * differ slightly in width and Curve-of-Spee curvature, so a pure translation leaves one
 * molar touching while the rest of the arch shows a growing gap. Fitting a plane to the
 * clearance field and correcting for its tilt (as a small pitch/roll rotation of the lower
 * arch) spreads the contact instead of anchoring the bite to one high spot.
 */
function fitGapPlane(cells: EnvelopeCell[]): { a: number; bx: number; bz: number } {
  let n = 0, Sx = 0, Sz = 0, Sg = 0, Sxx = 0, Szz = 0, Sxz = 0, Sxg = 0, Szg = 0;
  for (const p of cells) {
    n++;
    Sx += p.x; Sz += p.z; Sg += p.gap;
    Sxx += p.x * p.x; Szz += p.z * p.z; Sxz += p.x * p.z;
    Sxg += p.x * p.gap; Szg += p.z * p.gap;
  }

  // Solve the 3x3 normal-equations system:
  // [ n   Sx  Sz  ] [a ]   [Sg ]
  // [ Sx  Sxx Sxz ] [bx] = [Sxg]
  // [ Sz  Sxz Szz ] [bz]   [Szg]
  const A = new THREE.Matrix3().set(
    n, Sx, Sz,
    Sx, Sxx, Sxz,
    Sz, Sxz, Szz,
  );
  const det = A.determinant();
  if (Math.abs(det) < 1e-9) {
    return { a: n > 0 ? Sg / n : 0, bx: 0, bz: 0 };
  }
  const Ainv = A.clone().invert();
  const b = new THREE.Vector3(Sg, Sxg, Szg).applyMatrix3(Ainv);
  return { a: b.x, bx: b.y, bz: b.z };
}

/**
 * Computes the rigid transform (translation + small pitch/roll) to apply to the LOWER arch so
 * it seats in occlusal contact beneath a fixed UPPER arch. Both geometries must already be in
 * the canonical dental frame produced by `computeDentalNormalization`: Y up, +Z anterior,
 * midline at x = 0, each centred on its own bounding box.
 *
 * The lower is shifted posteriorly by a normal Class I overjet, then the vertical clearance
 * from the lower crowns up to the upper is measured across the shared footprint. A plane
 * through that clearance field gives the corrective tilt; what is left of it after the tilt
 * gives the vertical seat, taken at the closest approach so the arches meet rather than merge.
 *
 * This is a fit to two separately scanned surfaces, not a recorded bite. It cannot recover
 * the patient's real intercuspation - nothing can, without a bite scan - so it aims for the
 * defensible thing instead: crowns in contact at their closest point and nowhere passing
 * through each other, with the residual mismatch reported for the provider to correct by eye.
 */
function registerBite(
  upper: THREE.BufferGeometry,
  lower: THREE.BufferGeometry,
): OcclusionOffset {
  upper.computeBoundingBox();
  lower.computeBoundingBox();
  const dz = -OVERJET_MM;

  const stacked: OcclusionOffset = {
    dx: 0,
    dy: upper.boundingBox!.min.y - lower.boundingBox!.max.y,
    dz,
    pitchRad: 0,
    rollRad: 0,
    contactCells: 0,
    penetrationMm: 0,
    residualStdMm: NaN,
  };

  const samples = crownSamples(lower);
  if (samples.length === 0) return stacked;

  // Refine the tilt, then measure the final field against the tilt that came out of it.
  let pitchRad = 0;
  let rollRad = 0;
  let result = clearanceEnvelope(upper, samples, pitchRad, rollRad);

  for (let pass = 0; pass < TILT_PASSES; pass++) {
    if (result.cells.length < MIN_ENVELOPE_CELLS) return stacked;

    // Rotating the lower arch changes a point's height by about
    // Delta_y(x, z) = x*rollRad - z*pitchRad for the small angles involved here, and the new
    // clearance is the old one minus that. So cancelling the fitted slope needs
    // rollRad = bx and pitchRad = -bz, which leaves the clearance flat across the footprint.
    const { bx, bz } = fitGapPlane(result.cells);
    pitchRad = THREE.MathUtils.clamp(pitchRad - bz, -MAX_TILT_RAD, MAX_TILT_RAD);
    rollRad = THREE.MathUtils.clamp(rollRad + bx, -MAX_TILT_RAD, MAX_TILT_RAD);
    result = clearanceEnvelope(upper, samples, pitchRad, rollRad);
  }

  const { cells, baseY } = result;
  if (cells.length < MIN_ENVELOPE_CELLS) return stacked;

  const sorted = cells.map(cell => cell.gap).sort((a, b) => a - b);
  const seatIndex = Math.min(
    sorted.length - 1,
    Math.max(SEAT_INDEX_FLOOR, Math.floor(SEAT_PERCENTILE * sorted.length)),
  );
  const rise = sorted[seatIndex];

  // Clearance left at each cell once the arch has risen. Negative means that cell is inside
  // the opposing arch, which only the cells ahead of the seat index can be.
  let contactCells = 0;
  let bandSum = 0;
  let bandSumSq = 0;
  let bandCells = 0;
  for (const gap of sorted) {
    const clearance = gap - rise;
    if (clearance <= CONTACT_BAND_MM) contactCells++;
    if (clearance <= OCCLUDING_BAND_MM) {
      bandSum += clearance;
      bandSumSq += clearance * clearance;
      bandCells++;
    }
  }

  const mean = bandCells > 0 ? bandSum / bandCells : 0;
  const variance = bandCells > 0 ? Math.max(0, bandSumSq / bandCells - mean * mean) : NaN;

  return {
    dx: 0,
    dy: baseY + rise,
    dz,
    pitchRad,
    rollRad,
    contactCells,
    penetrationMm: rise - sorted[0],
    residualStdMm: Math.sqrt(variance),
  };
}

/** `registerBite`, memoised against the pair of arches it was derived from. */
export function computeOcclusionOffset(
  upper: THREE.BufferGeometry,
  lower: THREE.BufferGeometry,
): OcclusionOffset {
  let byLower = registrations.get(upper);
  if (!byLower) {
    byLower = new WeakMap();
    registrations.set(upper, byLower);
  }

  const cached = byLower.get(lower);
  if (cached) return cached;

  const offset = registerBite(upper, lower);
  byLower.set(lower, offset);
  return offset;
}
