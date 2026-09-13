import * as THREE from 'three';

/**
 * Splits a dental arch mesh into crown (tooth) and gingiva (gum) triangles so the two
 * can be rendered with different materials.
 *
 * There is no per-tooth segmentation here and none is needed: what separates enamel
 * from soft tissue on a scanned or CAD arch is the gingival margin, a single closed
 * curve running around the arch. It is found from the shape of the mesh itself rather
 * than from a fixed height, because the margin follows the scalloped gum line and sits
 * several millimetres deeper at the central incisors than at the molars.
 *
 * The cue is where the outer surface of the arch bends outward. Walking apically from a
 * cusp tip along one angular slice, the crown's outer radius traces a smooth curve, and
 * at the cervix the gum flares away from the tooth and the curve turns outward. That
 * turn, a positive second difference of the radial profile, is the margin. Measured per
 * angular slice, it tracks the scallop of the gum line automatically.
 *
 * An earlier version looked for a waist instead, the depth where the radius is smallest.
 * That fails on the teeth that matter most: a proclined incisor's labial surface runs
 * lingually all the way from the incisal edge into the gum, so its radius never bottoms
 * out and no waist exists to find. The bend is present either way.
 *
 * `segmentToothAndGum` must be called after the arch has been placed by
 * `applyDentalNormalization` and before any bounding volume hierarchy is built over the
 * geometry: it reorders triangles in place so the crown triangles come first, which is
 * what lets a single mesh carry two materials.
 */

/** Angular slices around the arch. 72 bins is 5 degrees each, roughly a third of a tooth. */
const BIN_COUNT = 72;
/** Depth resolution of the radial profile, in mm. */
const SLICE_MM = 0.25;
/** How far apically the profile is tracked, in mm. */
const PROFILE_MM = 14;
const SLICE_COUNT = Math.ceil(PROFILE_MM / SLICE_MM);
/** A gingival margin is never closer than this to the cusp tip. */
const MIN_MARGIN_MM = 3.5;
/** Nor further: central incisors are the longest crowns, at about 10-11 mm. */
const MAX_MARGIN_MM = 11;
/** Half-width of the window the profile's slope is measured over, in slices (1.25 mm). */
const KNEE_WINDOW_SLICES = 5;
/**
 * How sharply the profile has to bend outward to count as a gingival margin, in mm of
 * radius per mm of depth. The bend is the change in slope across the margin, so 0.3
 * means the surface turns outward by roughly 17 degrees there.
 */
const KNEE_MIN_SLOPE_CHANGE = 0.3;
/**
 * Bends sharper than this are not soft tissue. A gum line turns outward gently; a step
 * of several millimetres per millimetre is the trimmed edge of the model or the wall of
 * its base, and the bins around the posterior opening are full of them.
 */
const KNEE_MAX_SLOPE_CHANGE = 3;
/**
 * Radius step between adjacent depth slices that means the profile has jumped to a
 * different surface, in mm. Behind the last molar a single angular bin can hold both a
 * crown and the back wall of the model with nothing in between; the profile is cut off
 * at the jump rather than being allowed to bridge the two.
 */
const SURFACE_JUMP_MM = 1;
/**
 * Depth below the cusp tip from which the discontinuity test applies, in mm. Right at a
 * cusp tip the outermost radius genuinely grows by more than a millimetre per slice as
 * the surface spreads away from a point, so testing from zero cuts every profile short.
 */
const SURFACE_JUMP_FROM_MM = 2.5;
/** Depth of model kept clear of the margin search at the apical end, in mm. */
const BASE_GUARD_MM = 2;
/** Thickness of the occlusal band used to locate the centre of the horseshoe, in mm. */
const OCCLUSAL_BAND_MM = 4;
/** Below this a bin holds too little surface to support a profile. */
const MIN_BIN_VERTICES = 40;
/** Used only when no bin anywhere on the arch shows a detectable flare. */
const FALLBACK_MARGIN_MM = 6.5;

export interface GingivalMarginEstimate {
  /** Centre of the arch horseshoe in the X/Z plane, which angular bins are measured from. */
  centerX: number;
  centerZ: number;
  /** +1 when apical is +Y (upper arch, placed crowns-down), -1 for the lower arch. */
  sign: 1 | -1;
  /** Y of the occlusal extreme of the whole arch. */
  occlusalY: number;
  /** Per-bin margin depth below that bin's own cusp tip, in mm. */
  marginMm: Float64Array;
  /** Per-bin absolute Y of the margin, smoothed around the arch. */
  marginY: Float64Array;
  /** Per-bin depth of the bin's own cusp tip below the arch's occlusal extreme, in mm. */
  binTopDepth: Float64Array;
  /** Per-bin mean Z, for reporting where around the arch a bin sits. */
  binMeanZ: Float64Array;
  binVertices: Uint32Array;
  /** Per-bin strongest outward bend found in the profile, in mm of radius per mm of depth. */
  binKneeScore: Float64Array;
  /** 1 where the margin was measured, 0 where it was interpolated from neighbours. */
  detected: Uint8Array;
  populatedBins: number;
  detectedBins: number;
}

export interface ToothGumSplit {
  toothTriangles: number;
  gumTriangles: number;
  /** Mean depth of the gingival margin below the cusp tips, in mm. */
  meanMarginMm: number;
  minMarginMm: number;
  maxMarginMm: number;
  /**
   * Share of populated angular bins where a cervical waist was actually measured, as
   * opposed to filled in from neighbouring bins. A low value means the margin is
   * mostly interpolated and the split should be treated as indicative.
   */
  detectedFraction: number;
}

/** Circular index into the per-bin arrays. */
function wrapBin(bin: number): number {
  return ((bin % BIN_COUNT) + BIN_COUNT) % BIN_COUNT;
}

/**
 * Fills bins with no measured waist from their nearest measured neighbours on either
 * side, so the margin curve stays continuous across the posterior opening of the
 * horseshoe and across surfaces too flat to read.
 */
function fillMissingMargins(marginMm: Float64Array, detected: Uint8Array): void {
  const values: number[] = [];
  for (let b = 0; b < BIN_COUNT; b++) {
    if (detected[b]) values.push(marginMm[b]);
  }

  if (values.length === 0) {
    marginMm.fill(FALLBACK_MARGIN_MM);
    return;
  }

  values.sort((a, b) => a - b);
  const median = values[Math.floor(values.length / 2)];

  const nearest = (from: number, direction: 1 | -1): { value: number; distance: number } | null => {
    for (let step = 1; step <= BIN_COUNT; step++) {
      const probe = wrapBin(from + direction * step);
      if (detected[probe]) return { value: marginMm[probe], distance: step };
    }
    return null;
  };

  const filled = Float64Array.from(marginMm);
  for (let b = 0; b < BIN_COUNT; b++) {
    if (detected[b]) continue;
    const back = nearest(b, -1);
    const forward = nearest(b, 1);

    if (back && forward) {
      const span = back.distance + forward.distance;
      filled[b] = (back.value * forward.distance + forward.value * back.distance) / span;
    } else if (back) {
      filled[b] = back.value;
    } else if (forward) {
      filled[b] = forward.value;
    } else {
      filled[b] = median;
    }
  }
  marginMm.set(filled);
}

/**
 * Circular median of each bin and its two neighbours.
 *
 * Runs before smoothing, because averaging cannot undo a single badly-read bin: it
 * spreads the error over five. A median discards it outright, and unlike a mean it does
 * not flatten the scallop of the gum line, whose peaks at the interdental papillae are
 * real and only two or three bins wide.
 */
function medianFilterCircular(values: Float64Array): Float64Array {
  const out = new Float64Array(BIN_COUNT);
  for (let b = 0; b < BIN_COUNT; b++) {
    const window = [values[wrapBin(b - 1)], values[b], values[wrapBin(b + 1)]].sort((x, y) => x - y);
    out[b] = window[1];
  }
  return out;
}

/**
 * Light circular smoothing, so the boundary reads as a gum line and not as 72 steps.
 * Deliberately narrow: a wider kernel would average the papillae away.
 */
function smoothCircular(values: Float64Array): Float64Array {
  const weights = [1, 2, 1];
  const out = new Float64Array(BIN_COUNT);
  for (let b = 0; b < BIN_COUNT; b++) {
    let sum = 0;
    let weight = 0;
    for (let k = -1; k <= 1; k++) {
      const w = weights[k + 1];
      sum += values[wrapBin(b + k)] * w;
      weight += w;
    }
    out[b] = sum / weight;
  }
  return out;
}

/**
 * How sharply a depth profile bends outward at one slice, in mm of radius per mm of
 * depth: the slope over the window below the slice minus the slope over the window
 * above it. Positive where the surface turns away from the arch centre.
 */
function bendAt(profile: Float64Array, slice: number): number {
  const before = profile[slice - KNEE_WINDOW_SLICES];
  const here = profile[slice];
  const after = profile[slice + KNEE_WINDOW_SLICES];
  if (before < 0 || here < 0 || after < 0) return -Infinity;
  return (after - 2 * here + before) / (KNEE_WINDOW_SLICES * SLICE_MM);
}

/**
 * Estimates the gingival margin around an arch without modifying the geometry.
 *
 * Exposed separately from `segmentToothAndGum` so the margin can be inspected and
 * verified against real cases, where the useful checks are that the margin deepens
 * towards the anterior midline and that most bins are measured rather than interpolated.
 */
export function estimateGingivalMargin(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
): GingivalMarginEstimate | null {
  const pos = geometry.attributes.position as THREE.BufferAttribute | undefined;
  if (!pos || pos.count < 3) return null;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;

  // Upper arches are placed crowns-down and lower arches crowns-up, so "apical" is +Y
  // for the upper and -Y for the lower. `sign` turns a Y coordinate into a depth below
  // the occlusal surface, which makes everything below arch-agnostic.
  const sign: 1 | -1 = arch === 'upper' ? 1 : -1;
  const occlusalY = arch === 'upper' ? box.min.y : box.max.y;

  // 1. Centre of the horseshoe. Taken from the occlusal band rather than the whole
  // mesh, whose centroid is pulled off-centre by the model base.
  let centerX = 0;
  let centerZ = 0;
  let bandCount = 0;
  for (let i = 0; i < pos.count; i++) {
    if ((pos.getY(i) - occlusalY) * sign <= OCCLUSAL_BAND_MM) {
      centerX += pos.getX(i);
      centerZ += pos.getZ(i);
      bandCount++;
    }
  }
  if (bandCount < 100) {
    centerX = 0;
    centerZ = 0;
    for (let i = 0; i < pos.count; i++) {
      centerX += pos.getX(i);
      centerZ += pos.getZ(i);
    }
    bandCount = pos.count;
  }
  centerX /= bandCount;
  centerZ /= bandCount;

  // 2. Per-vertex angular position around that centre, plus radius. Held in scratch
  // arrays because atan2 over ~880,000 vertices is the most expensive step here and the
  // same values are needed again for classification.
  const binPos = new Float32Array(pos.count);
  const radius = new Float32Array(pos.count);
  const binTopDepth = new Float64Array(BIN_COUNT).fill(Infinity);
  const binVertices = new Uint32Array(BIN_COUNT);
  const binMeanZ = new Float64Array(BIN_COUNT);
  const TWO_PI = Math.PI * 2;

  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const dx = pos.getX(i) - centerX;
    const dz = z - centerZ;
    const u = ((Math.atan2(dz, dx) + Math.PI) / TWO_PI) * BIN_COUNT;
    binPos[i] = u;
    radius[i] = Math.sqrt(dx * dx + dz * dz);

    const bin = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor(u)));
    binVertices[bin]++;
    binMeanZ[bin] += z;
    const depth = (pos.getY(i) - occlusalY) * sign;
    if (depth < binTopDepth[bin]) binTopDepth[bin] = depth;
  }

  for (let bin = 0; bin < BIN_COUNT; bin++) {
    if (binVertices[bin] > 0) binMeanZ[bin] /= binVertices[bin];
    if (!Number.isFinite(binTopDepth[bin])) binTopDepth[bin] = 0;
  }

  // 3. Radial profile per bin: the outermost (buccal) radius at each depth below that
  // bin's own cusp tip. Depth is per bin because the occlusal plane curves, so a molar
  // cusp sits millimetres away from an incisal edge.
  const profile = new Float32Array(BIN_COUNT * SLICE_COUNT).fill(-1);
  const binMaxDepth = new Float64Array(BIN_COUNT);

  for (let i = 0; i < pos.count; i++) {
    const bin = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor(binPos[i])));
    const localDepth = (pos.getY(i) - occlusalY) * sign - binTopDepth[bin];
    if (localDepth > binMaxDepth[bin]) binMaxDepth[bin] = localDepth;
    if (localDepth < 0 || localDepth >= PROFILE_MM) continue;
    const slice = Math.floor(localDepth / SLICE_MM);
    const cell = bin * SLICE_COUNT + slice;
    if (radius[i] > profile[cell]) profile[cell] = radius[i];
  }

  // 4. Locate the gingival margin in each bin's profile.
  //
  // The margin is where the profile bends outward, which is measured as a change of
  // slope rather than as a local minimum of radius. A local minimum only shows up on
  // teeth whose crown runs roughly parallel to the model's vertical axis, so it finds
  // molars and premolars but misses incisors entirely: a proclined incisor's labial
  // surface moves lingually all the way from the incisal edge into the gum, so its
  // radius falls monotonically and never bottoms out. The bend survives that, because
  // the gum still turns outward relative to whatever the crown was doing.
  const marginMm = new Float64Array(BIN_COUNT);
  const detected = new Uint8Array(BIN_COUNT);
  const binKneeScore = new Float64Array(BIN_COUNT);
  let populatedBins = 0;

  const startSlice = Math.ceil(MIN_MARGIN_MM / SLICE_MM);
  const smoothed = new Float64Array(SLICE_COUNT);

  for (let bin = 0; bin < BIN_COUNT; bin++) {
    if (binVertices[bin] < MIN_BIN_VERTICES) continue;
    populatedBins++;

    // Stop short of the bottom of the model, where a trimmed base flares outward far
    // more sharply than any gum line.
    const limitMm = Math.min(MAX_MARGIN_MM, binMaxDepth[bin] - BASE_GUARD_MM);
    const endSlice = Math.min(
      Math.floor(limitMm / SLICE_MM),
      SLICE_COUNT - 1 - KNEE_WINDOW_SLICES,
    );
    if (endSlice <= startSlice) continue;

    // Forward-fill gaps, then smooth along depth. A single 5-degree bin samples the
    // buccal surface sparsely, and raw slice-to-slice noise on the order of a tenth of
    // a millimetre is enough to fake a bend. The fill stops at the first discontinuity,
    // past which the profile is no longer following one surface.
    let carried = -1;
    let truncated = SLICE_COUNT;
    for (let slice = 0; slice < SLICE_COUNT; slice++) {
      const value = profile[bin * SLICE_COUNT + slice];
      if (value >= 0) {
        const pastTip = slice * SLICE_MM >= SURFACE_JUMP_FROM_MM;
        if (pastTip && carried >= 0 && Math.abs(value - carried) > SURFACE_JUMP_MM) {
          truncated = slice;
          break;
        }
        carried = value;
      }
      smoothed[slice] = carried;
    }
    for (let slice = 1; slice < truncated - 1; slice++) {
      if (smoothed[slice - 1] < 0 || smoothed[slice + 1] < 0) continue;
      smoothed[slice] = (smoothed[slice - 1] + smoothed[slice] * 2 + smoothed[slice + 1]) / 4;
    }

    const searchEnd = Math.min(endSlice, truncated - 1 - KNEE_WINDOW_SLICES);
    // The gingival margin is the DEEPEST qualifying bend, not the strongest one. A
    // crown carries contour changes of its own - the buccal bulge, a marginal ridge -
    // and one of those can easily out-score the gum line, which on an incisor is a
    // gentle turn. Anything below the margin is gum, and gum has no further bend until
    // the base, which the guard band and the discontinuity cut-off already exclude.
    const firstSlice = Math.max(startSlice, KNEE_WINDOW_SLICES);
    let bestScore = 0;
    for (let slice = firstSlice; slice <= searchEnd; slice++) {
      const score = bendAt(smoothed, slice);
      if (score > KNEE_MAX_SLOPE_CHANGE) continue;
      if (score > bestScore) bestScore = score;
    }

    // Accept the deepest bend that is at least half as sharp as the sharpest one, which
    // is a compromise between two ways of being wrong. Taking the sharpest bend puts the
    // margin too high, because a crown carries contour changes of its own and the buccal
    // bulge often out-scores the gum line. Taking the deepest bend that clears the
    // absolute threshold puts it too low, because it picks up gentle undulations in the
    // gum itself. Relative to the sharpest bend in the same bin, the gum line survives
    // and the undulations do not.
    const acceptFrom = Math.max(KNEE_MIN_SLOPE_CHANGE, bestScore * 0.5);
    let marginSlice = -1;
    for (let slice = firstSlice; slice <= searchEnd; slice++) {
      const score = bendAt(smoothed, slice);
      if (score >= acceptFrom && score <= KNEE_MAX_SLOPE_CHANGE) marginSlice = slice;
    }

    binKneeScore[bin] = bestScore;
    if (marginSlice >= 0) {
      marginMm[bin] = marginSlice * SLICE_MM;
      detected[bin] = 1;
    }
  }

  let detectedBins = 0;
  for (let bin = 0; bin < BIN_COUNT; bin++) detectedBins += detected[bin];
  fillMissingMargins(marginMm, detected);
  marginMm.set(medianFilterCircular(marginMm));

  // 5. Margin as an absolute Y per bin, then smoothed so the boundary reads as a
  // continuous gum line rather than 72 discrete steps.
  const marginY = new Float64Array(BIN_COUNT);
  for (let bin = 0; bin < BIN_COUNT; bin++) {
    marginY[bin] = occlusalY + sign * (binTopDepth[bin] + marginMm[bin]);
  }

  return {
    centerX,
    centerZ,
    sign,
    occlusalY,
    marginMm,
    marginY: smoothCircular(marginY),
    binTopDepth,
    binMeanZ,
    binVertices,
    binKneeScore,
    detected,
    populatedBins,
    detectedBins,
  };
}

/**
 * Reorders whole triangles so that every triangle flagged in `isTooth` comes first,
 * returning the number of tooth triangles.
 *
 * Non-indexed geometry has its attribute arrays permuted rather than being given an
 * index buffer. An index would cost another 3.5 MB per stage on these meshes, and a
 * full case is held in memory at once; permuting is memory-neutral.
 */
/**
 * Drops a bounding volume hierarchy built over this geometry, if there is one.
 *
 * Reordering triangles leaves a tree pointing at the wrong ones, which would make every
 * pick and every displacement reading silently wrong rather than merely slow. Reached
 * through the prototype so this module does not have to depend on the BVH helper, and
 * guarded because the prototype patch is only installed on the client.
 */
function invalidateBoundsTree(geometry: THREE.BufferGeometry): void {
  const withTree = geometry as THREE.BufferGeometry & {
    boundsTree?: unknown;
    disposeBoundsTree?: () => void;
  };
  if (withTree.boundsTree && typeof withTree.disposeBoundsTree === 'function') {
    withTree.disposeBoundsTree();
  }
}

function reorderTrianglesToothFirst(
  geometry: THREE.BufferGeometry,
  isTooth: Uint8Array,
  triangleCount: number,
): number {
  invalidateBoundsTree(geometry);

  const order = new Uint32Array(triangleCount);
  let write = 0;
  for (let t = 0; t < triangleCount; t++) {
    if (isTooth[t]) order[write++] = t;
  }
  const toothTriangles = write;
  for (let t = 0; t < triangleCount; t++) {
    if (!isTooth[t]) order[write++] = t;
  }

  const permute = (array: THREE.TypedArray, itemsPerTriangle: number) => {
    const source = array.slice(0) as THREE.TypedArray;
    let cursor = 0;
    for (let i = 0; i < triangleCount; i++) {
      const base = order[i] * itemsPerTriangle;
      for (let j = 0; j < itemsPerTriangle; j++) {
        array[cursor++] = source[base + j];
      }
    }
  };

  const index = geometry.index;
  if (index) {
    permute(index.array as THREE.TypedArray, 3);
    index.needsUpdate = true;
  } else {
    for (const attribute of Object.values(geometry.attributes)) {
      const attr = attribute as THREE.BufferAttribute;
      permute(attr.array as THREE.TypedArray, attr.itemSize * 3);
      attr.needsUpdate = true;
    }
  }

  return toothTriangles;
}

/**
 * Estimates the gingival margin and reorders `geometry` so crown triangles precede gum
 * triangles, adding one material group for each. Safe to call twice: the result is
 * cached on the geometry's `userData`.
 *
 * Returns null for a geometry with no usable surface.
 */
export function segmentToothAndGum(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
): ToothGumSplit | null {
  const cached = geometry.userData?.toothGumSplit as ToothGumSplit | undefined;
  if (cached) return cached;

  const pos = geometry.attributes.position as THREE.BufferAttribute | undefined;
  if (!pos || pos.count < 3) return null;

  const index = geometry.index;
  const triangleCount = Math.floor((index ? index.count : pos.count) / 3);
  if (triangleCount < 1) return null;

  const margin = estimateGingivalMargin(geometry, arch);
  if (!margin) return null;

  const { centerX, centerZ, sign, marginY } = margin;
  const TWO_PI = Math.PI * 2;

  // A vertex's signed distance from the margin is positive on the crown side. A
  // triangle goes to the crown when its three vertices average positive, which puts the
  // seam on the margin itself instead of stepping along whole vertex classes.
  const signedAt = (i: number): number => {
    const dx = pos.getX(i) - centerX;
    const dz = pos.getZ(i) - centerZ;
    const u = ((Math.atan2(dz, dx) + Math.PI) / TWO_PI) * BIN_COUNT - 0.5;
    const lowBin = Math.floor(u);
    const frac = u - lowBin;
    const a = marginY[wrapBin(lowBin)];
    const b = marginY[wrapBin(lowBin + 1)];
    return ((a * (1 - frac) + b * frac) - pos.getY(i)) * sign;
  };

  const isTooth = new Uint8Array(triangleCount);
  for (let t = 0; t < triangleCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    if (signedAt(i0) + signedAt(i1) + signedAt(i2) > 0) isTooth[t] = 1;
  }

  const toothTriangles = reorderTrianglesToothFirst(geometry, isTooth, triangleCount);
  const gumTriangles = triangleCount - toothTriangles;

  geometry.clearGroups();
  if (toothTriangles > 0) geometry.addGroup(0, toothTriangles * 3, 0);
  if (gumTriangles > 0) geometry.addGroup(toothTriangles * 3, gumTriangles * 3, 1);

  let marginSum = 0;
  let marginMin = Infinity;
  let marginMax = -Infinity;
  for (let bin = 0; bin < BIN_COUNT; bin++) {
    const value = margin.marginMm[bin];
    marginSum += value;
    if (value < marginMin) marginMin = value;
    if (value > marginMax) marginMax = value;
  }

  const split: ToothGumSplit = {
    toothTriangles,
    gumTriangles,
    meanMarginMm: marginSum / BIN_COUNT,
    minMarginMm: marginMin,
    maxMarginMm: marginMax,
    detectedFraction: margin.populatedBins > 0 ? margin.detectedBins / margin.populatedBins : 0,
  };

  geometry.userData = { ...geometry.userData, toothGumSplit: split };
  return split;
}
