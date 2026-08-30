import * as THREE from 'three';

// In-memory cache for AI segmentation results
const segmentationCache = new Map<string, {
  fdiLabels: number[];
  detectedTeeth: number[];
  classDistribution: Record<number, number>;
  source: string;
}>();

// Distinct vibrant pastel colors for individual FDI teeth identification
export const FDI_TOOTH_PALETTE: Record<number, [number, number, number]> = {
  // Upper Right (Quadrant 1)
  17: [0.95, 0.40, 0.40],
  16: [0.95, 0.55, 0.35],
  15: [0.90, 0.70, 0.30],
  14: [0.85, 0.85, 0.25],
  13: [0.60, 0.85, 0.30],
  12: [0.35, 0.85, 0.45],
  11: [0.30, 0.85, 0.70],
  // Upper Left (Quadrant 2)
  21: [0.30, 0.75, 0.90],
  22: [0.35, 0.55, 0.95],
  23: [0.55, 0.45, 0.95],
  24: [0.75, 0.35, 0.95],
  25: [0.90, 0.35, 0.85],
  26: [0.95, 0.35, 0.65],
  27: [0.95, 0.40, 0.50],
  // Lower Left (Quadrant 3)
  31: [0.30, 0.75, 0.90],
  32: [0.35, 0.55, 0.95],
  33: [0.55, 0.45, 0.95],
  34: [0.75, 0.35, 0.95],
  35: [0.90, 0.35, 0.85],
  36: [0.95, 0.35, 0.65],
  37: [0.95, 0.40, 0.50],
  // Lower Right (Quadrant 4)
  47: [0.95, 0.40, 0.40],
  46: [0.95, 0.55, 0.35],
  45: [0.90, 0.70, 0.30],
  44: [0.85, 0.85, 0.25],
  43: [0.60, 0.85, 0.30],
  42: [0.35, 0.85, 0.45],
  41: [0.30, 0.85, 0.70],
};

interface ToothSlot {
  fdi: number;
  centerAngle: number;
}

const UPPER_FDI_SLOTS: ToothSlot[] = [
  { fdi: 17, centerAngle: -1.35 },
  { fdi: 16, centerAngle: -1.10 },
  { fdi: 15, centerAngle: -0.85 },
  { fdi: 14, centerAngle: -0.62 },
  { fdi: 13, centerAngle: -0.40 },
  { fdi: 12, centerAngle: -0.22 },
  { fdi: 11, centerAngle: -0.07 },
  { fdi: 21, centerAngle:  0.07 },
  { fdi: 22, centerAngle:  0.22 },
  { fdi: 23, centerAngle:  0.40 },
  { fdi: 24, centerAngle:  0.62 },
  { fdi: 25, centerAngle:  0.85 },
  { fdi: 26, centerAngle:  1.10 },
  { fdi: 27, centerAngle:  1.35 },
];

const LOWER_FDI_SLOTS: ToothSlot[] = [
  { fdi: 47, centerAngle: -1.35 },
  { fdi: 46, centerAngle: -1.10 },
  { fdi: 45, centerAngle: -0.85 },
  { fdi: 44, centerAngle: -0.62 },
  { fdi: 43, centerAngle: -0.40 },
  { fdi: 42, centerAngle: -0.22 },
  { fdi: 41, centerAngle: -0.07 },
  { fdi: 31, centerAngle:  0.07 },
  { fdi: 32, centerAngle:  0.22 },
  { fdi: 33, centerAngle:  0.40 },
  { fdi: 34, centerAngle:  0.62 },
  { fdi: 35, centerAngle:  0.85 },
  { fdi: 36, centerAngle:  1.10 },
  { fdi: 37, centerAngle:  1.35 },
];

function findClosestFDI(angle: number, isUpper: boolean): number {
  const slots = isUpper ? UPPER_FDI_SLOTS : LOWER_FDI_SLOTS;
  let closest = slots[0];
  let minDiff = Infinity;
  for (let i = 0; i < slots.length; i++) {
    const diff = Math.abs(angle - slots[i].centerAngle);
    if (diff < minDiff) {
      minDiff = diff;
      closest = slots[i];
    }
  }
  return closest.fdi;
}

export interface AISegmentationResult {
  fdiLabels: number[];
  detectedTeeth: number[];
  classDistribution: Record<number, number>;
  source: string;
}

/**
 * Calls local MeshSegNet microservice to obtain per-triangle FDI segmentation.
 */
export async function fetchMeshSegNetSegmentation(
  fileOrName: Blob | string,
  arch: 'upper' | 'lower'
): Promise<AISegmentationResult | null> {
  const cacheKey = typeof fileOrName === 'string' ? `${fileOrName}_${arch}` : `blob_${arch}_${fileOrName.size}`;
  if (segmentationCache.has(cacheKey)) {
    return segmentationCache.get(cacheKey)!;
  }

  try {
    const formData = new FormData();
    if (typeof fileOrName === 'string') {
      formData.append('filename', fileOrName);
    } else {
      formData.append('file', fileOrName, 'model.stl');
    }
    formData.append('arch', arch);

    const res = await fetch('/api/ai-segment', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.fdi_labels && data.fdi_labels.length > 0) {
        const result: AISegmentationResult = {
          fdiLabels: data.fdi_labels,
          detectedTeeth: data.detected_teeth || [],
          classDistribution: data.class_distribution || {},
          source: data.source || 'meshsegnet-ai',
        };
        segmentationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('[MeshSegNet] AI service unreachable:', err);
  }

  return null;
}

/**
 * Applies MeshSegNet per-triangle FDI labels to a Three.js BufferGeometry.
 */
export function applyAISegmentationLabels(
  geometry: THREE.BufferGeometry,
  fdiLabels: number[] | Int32Array | Uint8Array,
  arch: 'upper' | 'lower',
  coloredTeethMode = false
): THREE.BufferGeometry {
  const pos = geometry.attributes.position;
  const count = pos.count;
  const numTriangles = Math.floor(count / 3);
  const colors = new Float32Array(count * 3);

  const toothR = 0.992, toothG = 0.995, toothB = 0.998;
  const gumBodyR = 0.850, gumBodyG = 0.390, gumBodyB = 0.450;

  for (let t = 0; t < numTriangles; t++) {
    const fdi = t < fdiLabels.length ? fdiLabels[t] : 0;
    const i0 = t * 3;
    const i1 = t * 3 + 1;
    const i2 = t * 3 + 2;

    let r = toothR, g = toothG, b = toothB;
    if (fdi > 0) {
      if (coloredTeethMode && FDI_TOOTH_PALETTE[fdi]) {
        const [pr, pg, pb] = FDI_TOOTH_PALETTE[fdi];
        r = pr; g = pg; b = pb;
      }
    } else {
      r = gumBodyR; g = gumBodyG; b = gumBodyB;
    }

    for (const vIdx of [i0, i1, i2]) {
      const idx = vIdx * 3;
      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;
    }
  }

  geometry.userData.fdiLabels = Array.from(fdiLabels);
  geometry.userData.arch = arch;

  const colorAttr = new THREE.BufferAttribute(colors, 3);
  colorAttr.needsUpdate = true;
  geometry.setAttribute('color', colorAttr);
  return geometry;
}

/**
 * High-Precision Dental Anatomical Segmentation & Photorealistic Studio Coloring Engine
 * 
 * - Full 3D Horseshoe Dental Arch Ribbon (Anterior Arc + Bilateral Posterior Branches)
 * - Inverted-U Cervical Scallops around every tooth crown
 * - 100% Solid Pearlescent Enamel White on all crowns, cusps, and orthodontic attachments
 * - Healthy Natural Coral Pink Attached Gingiva with vascular depth shading
 * - Natural Palatal Vault Mucosa
 * - Attaches per-triangle FDI IDs to `geometry.userData.fdiLabels` for tooltip hover
 */
export function segmentDentalMeshAI(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
  coloredTeethMode = false
): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const minX = bbox.min.x, maxX = bbox.max.x;
  const minY = bbox.min.y, maxY = bbox.max.y;
  const minZ = bbox.min.z, maxZ = bbox.max.z;

  const height = Math.max(0.001, maxY - minY);
  const sizeX = Math.max(0.001, maxX - minX);
  const sizeZ = Math.max(0.001, maxZ - minZ);

  const pos = geometry.attributes.position;
  const count = pos.count;
  const numTriangles = Math.floor(count / 3);
  const colors = new Float32Array(count * 3);
  const fdiLabels = new Int32Array(numTriangles);

  const isUpper = arch === 'upper';

  // Realistic Clinical Dental Palette
  // Pure Lustrous Pearlescent Enamel White (#FDFEFE)
  const toothR = 0.992, toothG = 0.995, toothB = 0.998;

  // Healthy Attached Gingiva (#E57385 / #D65D70 Coral Pink)
  const gumMarginR = 0.910, gumMarginG = 0.490, gumMarginB = 0.540; // #E87D8A Free Gingival Margin
  const gumBodyR   = 0.850, gumBodyG   = 0.390, gumBodyB   = 0.450; // #D96373 Attached Gingiva
  const gumDeepR   = 0.740, gumDeepG   = 0.270, gumDeepB   = 0.330; // #BD4554 Vestibular Sulcus / Base
  const palateR    = 0.875, palateG    = 0.435, palateB    = 0.495; // #DF6F7E Palatal Vault Mucosa

  // Precise Horseshoe Arch Parameters scaled to current mesh
  const branchX = sizeX * 0.385;
  const antZSplit = minZ + sizeZ * 0.62;

  for (let t = 0; t < numTriangles; t++) {
    const i0 = t * 3;
    const i1 = t * 3 + 1;
    const i2 = t * 3 + 2;

    const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
    const cy = (pos.getY(i0) + pos.getY(i1) + pos.getY(i2)) / 3;
    const cz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;

    // 1. Distance to Arch Centerline & Vault Isolation
    let distArch = 0;
    let isVault = false;

    if (cz >= antZSplit) {
      // Anterior Semi-Ellipse Arc
      const normAntX = cx / (branchX * 0.82);
      const normAntZ = (cz - antZSplit) / Math.max(0.1, maxZ - antZSplit);
      const rAnt = Math.sqrt(normAntX * normAntX + normAntZ * normAntZ);
      distArch = Math.abs(rAnt - 1.0) * branchX;
      isVault = rAnt < 0.45;
    } else {
      // Posterior Bilateral Branches (Left & Right Molars/Premolars)
      const distLeft = Math.abs(cx - (-branchX));
      const distRight = Math.abs(cx - (+branchX));
      distArch = Math.min(distLeft, distRight);
      isVault = Math.abs(cx) < branchX * 0.62;
    }

    // Tooth Arch Ribbon Width
    const onRibbon = (distArch <= 16.0) && !isVault;

    // 2. Parabolic Cervical Scalloping along arch polar angle
    const theta = Math.atan2(cx, Math.max(0.1, cz - minZ));
    const scallop = 0.45 * Math.cos(14 * theta);

    let isTooth = false;
    if (isUpper) {
      // Upper Arch (Crowns point down towards -Y, Base/Gums up towards +Y)
      // CEJ is at 58% of scan height from incisal base
      const yCervical = minY + 0.58 * height - scallop;
      isTooth = onRibbon && (cy < yCervical);
    } else {
      // Lower Arch (Crowns point up towards +Y, Base/Gums down towards -Y)
      // CEJ is at 58% of scan height from incisal top
      const yCervical = maxY - 0.58 * height - scallop;
      isTooth = onRibbon && (cy > yCervical);
    }

    let r = toothR;
    let g = toothG;
    let b = toothB;

    if (isTooth) {
      const fdi = findClosestFDI(theta, isUpper);
      fdiLabels[t] = fdi;

      if (coloredTeethMode && FDI_TOOTH_PALETTE[fdi]) {
        const [pr, pg, pb] = FDI_TOOTH_PALETTE[fdi];
        r = pr;
        g = pg;
        b = pb;
      } else {
        r = toothR;
        g = toothG;
        b = toothB;
      }
    } else {
      fdiLabels[t] = 0; // Gingiva / Palate

      if (isUpper && isVault) {
        // Palatal Vault Mucosa
        r = palateR;
        g = palateG;
        b = palateB;
      } else {
        // Attached Gingiva with vascular depth gradient
        let depth = 0;
        if (isUpper) {
          const cej = minY + 0.58 * height;
          depth = Math.max(0, cy - cej) / Math.max(0.1, maxY - cej);
        } else {
          const cej = maxY - 0.58 * height;
          depth = Math.max(0, cej - cy) / Math.max(0.1, cej - minY);
        }
        const marginProximity = Math.max(0, 1.0 - depth);

        if (depth > 0.35) {
          const w = Math.min(1, (depth - 0.35) / 0.65);
          r = gumBodyR * (1 - w) + gumDeepR * w;
          g = gumBodyG * (1 - w) + gumDeepG * w;
          b = gumBodyB * (1 - w) + gumDeepB * w;
        } else {
          const w = Math.min(1, marginProximity);
          r = gumBodyR * (1 - w * 0.35) + gumMarginR * (w * 0.35);
          g = gumBodyG * (1 - w * 0.35) + gumMarginG * (w * 0.35);
          b = gumBodyB * (1 - w * 0.35) + gumMarginB * (w * 0.35);
        }
      }
    }

    for (const vIdx of [i0, i1, i2]) {
      const idx = vIdx * 3;
      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;
    }
  }

  geometry.userData.fdiLabels = Array.from(fdiLabels);
  geometry.userData.arch = arch;

  const colorAttr = new THREE.BufferAttribute(colors, 3);
  colorAttr.needsUpdate = true;
  geometry.setAttribute('color', colorAttr);
  return geometry;
}
