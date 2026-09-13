import * as THREE from 'three';

export interface OcclusionOffset {
  dx: number;
  dy: number;
  dz: number;
  /** Rotation to apply to the lower arch about X (tips front/back, corrects Curve-of-Spee mismatch). */
  pitchRad: number;
  /** Rotation to apply to the lower arch about Z (tips left/right, corrects arch-width/curvature mismatch). */
  rollRad: number;
  contactCells: number;
  /** Std. deviation of the residual gap after fitting, in mm - lower means a flatter, more even bite. */
  residualStdMm: number;
}

const CELL_MM = 1.0;
const OVERJET_MM = 2.0;
const INTERDIGITATION_MM = 0.3;
const BASE_BAND_MM = 2.0;

interface HeightMap {
  minX: number;
  minZ: number;
  cols: number;
  rows: number;
  values: Float32Array;
}

// For each XZ cell, records the extreme Y of the surface (min for the upper's
// occlusal side, max for the lower's). Cells inside `baseBandMm` of the arch's
// far side are the flat plaster base, not crowns, and are left unset.
function buildHeightMap(
  geometry: THREE.BufferGeometry,
  side: 'upperMinY' | 'lowerMaxY',
  zShift: number,
  minX: number,
  minZ: number,
  cols: number,
  rows: number,
): HeightMap {
  const pos = geometry.attributes.position;
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const wantMin = side === 'upperMinY';
  const baseCutoff = wantMin ? bbox.max.y - BASE_BAND_MM : bbox.min.y + BASE_BAND_MM;

  const values = new Float32Array(cols * rows).fill(NaN);

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (wantMin ? y >= baseCutoff : y <= baseCutoff) continue;

    const col = Math.floor((pos.getX(i) - minX) / CELL_MM);
    const row = Math.floor((pos.getZ(i) + zShift - minZ) / CELL_MM);
    if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

    const idx = row * cols + col;
    const current = values[idx];
    if (Number.isNaN(current) || (wantMin ? y < current : y > current)) {
      values[idx] = y;
    }
  }

  return { minX, minZ, cols, rows, values };
}

/**
 * Least-squares fit of gap(x, z) = a + bx*x + bz*z over the sampled contact
 * cells. A single rigid Y-shift can only bring ONE point of the arch into
 * contact; real upper/lower arches differ slightly in width and Curve-of-Spee
 * curvature, so a pure translation leaves the center touching while the sides
 * (or front/back) show a growing gap. Fitting a plane to the gap field and
 * correcting for its tilt (as a small pitch/roll rotation of the lower arch)
 * evens that residual out instead of anchoring to one extremal contact point.
 */
function fitGapPlane(points: { x: number; z: number; gap: number }[]): { a: number; bx: number; bz: number } {
  let n = 0, Sx = 0, Sz = 0, Sg = 0, Sxx = 0, Szz = 0, Sxz = 0, Sxg = 0, Szg = 0;
  for (const p of points) {
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
 * Computes the rigid transform (translation + small pitch/roll) to apply to
 * the LOWER arch so it sits in cusp-to-fossa contact beneath a fixed UPPER
 * arch. Both geometries must already be in the canonical dental frame produced
 * by `normalizeDentalGeometry` (Y up, +Z anterior, midline at x = 0, each
 * centered vertically on its own bbox).
 *
 * The lower is shifted posteriorly by a normal Class I overjet, then a plane
 * is fit to the vertical gap between upper and lower crown surfaces across
 * their shared footprint; the plane's intercept becomes the vertical drop and
 * its slope becomes a small corrective tilt, so contact is spread evenly
 * across the arch instead of pivoting on a single closest point.
 */
export function computeOcclusionOffset(
  upper: THREE.BufferGeometry,
  lower: THREE.BufferGeometry,
): OcclusionOffset {
  upper.computeBoundingBox();
  lower.computeBoundingBox();
  const ub = upper.boundingBox!;
  const lb = lower.boundingBox!;

  const dz = -OVERJET_MM;
  const minX = Math.min(ub.min.x, lb.min.x);
  const maxX = Math.max(ub.max.x, lb.max.x);
  const minZ = Math.min(ub.min.z, lb.min.z + dz);
  const maxZ = Math.max(ub.max.z, lb.max.z + dz);
  const cols = Math.ceil((maxX - minX) / CELL_MM) + 1;
  const rows = Math.ceil((maxZ - minZ) / CELL_MM) + 1;

  const upperMap = buildHeightMap(upper, 'upperMinY', 0, minX, minZ, cols, rows);
  const lowerMap = buildHeightMap(lower, 'lowerMaxY', dz, minX, minZ, cols, rows);

  const points: { x: number; z: number; gap: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const u = upperMap.values[idx];
      const l = lowerMap.values[idx];
      if (Number.isNaN(u) || Number.isNaN(l)) continue;
      points.push({
        x: minX + (col + 0.5) * CELL_MM,
        z: minZ + (row + 0.5) * CELL_MM,
        gap: u - l,
      });
    }
  }

  if (points.length < 20) {
    // Not enough overlapping crown footprint to fit a plane: stack bbox-to-bbox.
    return { dx: 0, dy: ub.min.y - lb.max.y, dz, pitchRad: 0, rollRad: 0, contactCells: points.length, residualStdMm: NaN };
  }

  const { a, bx, bz } = fitGapPlane(points);

  // gap(x,z) ~= a + bx*x + bz*z. Rotating the lower arch (rotateX then rotateZ,
  // applied in that order about its own centroid) changes a point's height by
  // approximately Delta_y(x,z) = x*rollRad - z*pitchRad for the small angles
  // involved here. New gap = old gap - Delta_y, so canceling the fitted slope
  // requires rollRad = bx and pitchRad = -bz, leaving the gap at its now-flat
  // intercept `a` everywhere; dy then only has to close that flat remaining gap.
  const pitchRad = -bz;
  const rollRad = bx;
  const dy = a + INTERDIGITATION_MM;

  let residualSumSq = 0;
  for (const p of points) {
    const predicted = a + bx * p.x + bz * p.z;
    const residual = p.gap - predicted;
    residualSumSq += residual * residual;
  }
  const residualStdMm = Math.sqrt(residualSumSq / points.length);

  return { dx: 0, dy, dz, pitchRad, rollRad, contactCells: points.length, residualStdMm };
}
