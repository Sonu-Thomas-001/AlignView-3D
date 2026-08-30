import * as THREE from 'three';

/**
 * 14 Discrete Anatomical Tooth Crown Slots (FDI Dental Notation)
 * Defines individual crown zeniths, interdental contact points, and parabolic cervical margins
 */
interface ToothSlot {
  fdi: number;
  name: string;
  center: number;
  width: number;
  zenithNormY: number;
  papillaNormY: number;
}

const UPPER_TOOTH_SLOTS: ToothSlot[] = [
  { fdi: 17, name: 'UR M2', center: -0.90, width: 0.14, zenithNormY: 0.44, papillaNormY: 0.32 },
  { fdi: 16, name: 'UR M1', center: -0.76, width: 0.14, zenithNormY: 0.46, papillaNormY: 0.32 },
  { fdi: 15, name: 'UR P2', center: -0.62, width: 0.13, zenithNormY: 0.49, papillaNormY: 0.33 },
  { fdi: 14, name: 'UR P1', center: -0.47, width: 0.13, zenithNormY: 0.52, papillaNormY: 0.34 },
  { fdi: 13, name: 'UR C',  center: -0.31, width: 0.14, zenithNormY: 0.56, papillaNormY: 0.35 },
  { fdi: 12, name: 'UR I2', center: -0.17, width: 0.12, zenithNormY: 0.53, papillaNormY: 0.34 },
  { fdi: 11, name: 'UR I1', center: -0.05, width: 0.12, zenithNormY: 0.58, papillaNormY: 0.34 },
  { fdi: 21, name: 'UL I1', center:  0.05, width: 0.12, zenithNormY: 0.58, papillaNormY: 0.34 },
  { fdi: 22, name: 'UL I2', center:  0.17, width: 0.12, zenithNormY: 0.53, papillaNormY: 0.34 },
  { fdi: 23, name: 'UL C',  center:  0.31, width: 0.14, zenithNormY: 0.56, papillaNormY: 0.35 },
  { fdi: 24, name: 'UL P1', center:  0.47, width: 0.13, zenithNormY: 0.52, papillaNormY: 0.34 },
  { fdi: 25, name: 'UL P2', center:  0.62, width: 0.13, zenithNormY: 0.49, papillaNormY: 0.33 },
  { fdi: 26, name: 'UL M1', center:  0.76, width: 0.14, zenithNormY: 0.46, papillaNormY: 0.32 },
  { fdi: 27, name: 'UL M2', center:  0.90, width: 0.14, zenithNormY: 0.44, papillaNormY: 0.32 },
];

const LOWER_TOOTH_SLOTS: ToothSlot[] = [
  { fdi: 47, name: 'LR M2', center: -0.90, width: 0.14, zenithNormY: 0.56, papillaNormY: 0.68 },
  { fdi: 46, name: 'LR M1', center: -0.76, width: 0.14, zenithNormY: 0.54, papillaNormY: 0.68 },
  { fdi: 45, name: 'LR P2', center: -0.62, width: 0.13, zenithNormY: 0.51, papillaNormY: 0.67 },
  { fdi: 44, name: 'LR P1', center: -0.47, width: 0.13, zenithNormY: 0.48, papillaNormY: 0.66 },
  { fdi: 43, name: 'LR C',  center: -0.31, width: 0.14, zenithNormY: 0.44, papillaNormY: 0.65 },
  { fdi: 42, name: 'LR I2', center: -0.17, width: 0.12, zenithNormY: 0.47, papillaNormY: 0.66 },
  { fdi: 41, name: 'LR I1', center: -0.05, width: 0.12, zenithNormY: 0.42, papillaNormY: 0.66 },
  { fdi: 31, name: 'LL I1', center:  0.05, width: 0.12, zenithNormY: 0.42, papillaNormY: 0.66 },
  { fdi: 32, name: 'LL I2', center:  0.17, width: 0.12, zenithNormY: 0.47, papillaNormY: 0.66 },
  { fdi: 33, name: 'LL C',  center:  0.31, width: 0.14, zenithNormY: 0.44, papillaNormY: 0.65 },
  { fdi: 34, name: 'LL P1', center:  0.47, width: 0.13, zenithNormY: 0.48, papillaNormY: 0.66 },
  { fdi: 35, name: 'LL P2', center:  0.62, width: 0.13, zenithNormY: 0.51, papillaNormY: 0.67 },
  { fdi: 36, name: 'LL M1', center:  0.76, width: 0.14, zenithNormY: 0.54, papillaNormY: 0.68 },
  { fdi: 37, name: 'LL M2', center:  0.90, width: 0.14, zenithNormY: 0.56, papillaNormY: 0.68 },
];

function calculateSlotMargin(s: number, slots: ToothSlot[], isUpper: boolean): number {
  let closest = slots[0];
  let minDist = 999;
  for (let i = 0; i < slots.length; i++) {
    const d = Math.abs(s - slots[i].center);
    if (d < minDist) {
      minDist = d;
      closest = slots[i];
    }
  }

  const rel = (s - closest.center) / (closest.width * 0.5);
  const clampedRel = Math.max(-1.0, Math.min(1.0, rel));

  if (isUpper) {
    // Upper Arch: Inverted parabola (zenith at center rel=0, papilla dips at rel=+/-1)
    const curve = clampedRel * clampedRel;
    return closest.zenithNormY - (closest.zenithNormY - closest.papillaNormY) * curve;
  } else {
    // Lower Arch: Upward parabola (zenith at center rel=0, papilla peaks at rel=+/-1)
    const curve = clampedRel * clampedRel;
    return closest.zenithNormY + (closest.papillaNormY - closest.zenithNormY) * curve;
  }
}

/**
 * AI-Enhanced Anatomical Scalloped Gingival Margin Segmentation Engine
 * 
 * - Per-Triangle Solid Coloring: Zero Gouraud interpolation blur, 100% razor-sharp clinical boundary
 * - Distinct inverted-'U' crown zeniths over each individual tooth
 * - Sharp triangular interdental papillae dipping between every tooth pair
 * - 100% Solid Pearlescent White on all tooth crowns and composite orthodontic brackets
 * - Rich Coral-Rose Gingiva with multi-tone vascular base shading
 */
export function segmentDentalMeshAI(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower'
): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const minY = bbox.min.y;
  const maxY = bbox.max.y;
  const minX = bbox.min.x;
  const maxX = bbox.max.x;
  const minZ = bbox.min.z;
  const maxZ = bbox.max.z;

  const height = Math.max(0.001, maxY - minY);
  const sizeX = Math.max(0.001, maxX - minX);
  const sizeZ = Math.max(0.001, maxZ - minZ);

  const pos = geometry.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  const isUpper = arch === 'upper';
  const slots = isUpper ? UPPER_TOOTH_SLOTS : LOWER_TOOTH_SLOTS;

  // 1. Anatomical Color Palette
  // Enamel: Pure lustrous pearl white (#FFFFFF)
  const toothR = 1.000, toothG = 1.000, toothB = 1.000;

  // Gingiva: Rich saturated warm coral-rose matching reference image (#DC7080)
  const gumMarginR = 0.885, gumMarginG = 0.445, gumMarginB = 0.500; // #E27180
  const gumBodyR = 0.820, gumBodyG = 0.365, gumBodyB = 0.425;     // #D15D6C
  const gumDeepR = 0.720, gumDeepG = 0.265, gumDeepB = 0.325;     // #B84352

  // 2. Per-Triangle Non-Interpolated Solid Coloring (Zero Gradient Blur / Zero Overlap)
  const numTriangles = Math.floor(count / 3);

  for (let t = 0; t < numTriangles; t++) {
    const i0 = t * 3;
    const i1 = t * 3 + 1;
    const i2 = t * 3 + 2;

    // Evaluate centroid of triangle
    const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
    const cy = (pos.getY(i0) + pos.getY(i1) + pos.getY(i2)) / 3;
    const cz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;

    const normY = (cy - minY) / height;
    const zProg = Math.max(0, Math.min(1, (cz - minZ) / sizeZ)); // 0 = posterior molars, 1 = anterior incisors

    // Normalize arch parameter s along curve [-1, +1]
    const s = (cx / (sizeX * 0.5)) * Math.pow(1.0 - zProg * 0.45, 0.35);

    // Compute precise parabolic cervical margin for this specific tooth slot
    const marginY = calculateSlotMargin(s, slots, isUpper);

    // Discrete Binary Classification for the ENTIRE triangle:
    let isGumTriangle = false;
    if (isUpper) {
      isGumTriangle = normY > marginY;
    } else {
      isGumTriangle = normY < marginY;
    }

    let r = toothR;
    let g = toothG;
    let b = toothB;

    if (isGumTriangle) {
      // 100% Coral-Rose Gingiva with natural vascular base depth gradient
      const baseDist = isUpper ? Math.max(0, normY - 0.60) / 0.40 : Math.max(0, 0.40 - normY) / 0.40;
      const neckDist = isUpper ? Math.max(0, 0.70 - normY) / 0.30 : Math.max(0, normY - 0.30) / 0.30;

      let finalGumR = gumBodyR;
      let finalGumG = gumBodyG;
      let finalGumB = gumBodyB;

      if (baseDist > 0) {
        finalGumR = gumBodyR * (1 - baseDist) + gumDeepR * baseDist;
        finalGumG = gumBodyG * (1 - baseDist) + gumDeepG * baseDist;
        finalGumB = gumBodyB * (1 - baseDist) + gumDeepB * baseDist;
      } else if (neckDist > 0) {
        finalGumR = gumBodyR * (1 - neckDist * 0.35) + gumMarginR * (neckDist * 0.35);
        finalGumG = gumBodyG * (1 - neckDist * 0.35) + gumMarginG * (neckDist * 0.35);
        finalGumB = gumBodyB * (1 - neckDist * 0.35) + gumMarginB * (neckDist * 0.35);
      }

      r = finalGumR;
      g = finalGumG;
      b = finalGumB;
    }

    // Assign identical color to all 3 vertices of this triangle (Zero Gouraud bleed)
    for (const vIdx of [i0, i1, i2]) {
      const idx = vIdx * 3;
      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;
    }
  }

  const colorAttr = new THREE.BufferAttribute(colors, 3);
  colorAttr.needsUpdate = true;
  geometry.setAttribute('color', colorAttr);
  if (geometry.attributes.color) {
    geometry.attributes.color.needsUpdate = true;
  }
  return geometry;
}
