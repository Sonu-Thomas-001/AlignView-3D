import * as THREE from 'three';

/**
 * AI-Enhanced Anatomical Scalloped Gingival Margin Segmentation Engine
 * 
 * - Full Crown Preservation: Upper crowns extend up to normY = 0.54, Lower crowns down to normY = 0.46
 * - Natural Scalloped Gingival Margins: Inverted 'U' zeniths over tooth crowns and interdental papillae dips
 * - 100% Pure Pearlescent White on all tooth crowns, incisal edges, and composite attachments
 * - Rich Coral-Rose Gingiva on mucosal base
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
  const sizeZ = Math.max(0.001, maxZ - minZ);

  const pos = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  const isUpper = arch === 'upper';

  // 1. Anatomical Color Palette
  // Enamel: Pure lustrous pearl white (#FFFFFF)
  const toothR = 1.000, toothG = 1.000, toothB = 1.000;

  // Gingiva: Rich saturated warm coral-rose with natural vascular base gradient
  const gumMarginR = 0.865, gumMarginG = 0.445, gumMarginB = 0.500; // #DC7280
  const gumBodyR = 0.810, gumBodyG = 0.365, gumBodyB = 0.425;     // #CF5D6C
  const gumDeepR = 0.710, gumDeepG = 0.265, gumDeepB = 0.325;     // #B54352

  // 2. Clinical Anatomical Gingival Margin Calculation
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const ny = normals ? normals.getY(i) : 0;
    const nz = normals ? normals.getZ(i) : 1;

    const normY = (y - minY) / height;
    const zProgress = Math.max(0, Math.min(1, (z - minZ) / sizeZ)); // 0 = posterior back, 1 = anterior front

    // Arch polar angle theta: 0 = anterior incisors, +/- 1.5 = posterior molars
    const theta = Math.atan2(x, Math.max(0.001, z - minZ));

    // Dynamic Clinical Margin Heights:
    // Upper Arch: Crown height extends up to normY = 0.54 on central incisors, 0.42 on molars
    // Lower Arch: Crown height extends down to normY = 0.46 on central incisors, 0.58 on molars
    const baseMargin = 0.42 + 0.12 * Math.pow(zProgress, 0.75);
    const scallopWave = 0.035 * Math.cos(14 * theta) - 0.012 * Math.cos(28 * theta);
    const marginY = Math.max(0.36, Math.min(0.60, baseMargin + scallopWave));

    let gumFactor = 0; // 0.0 = Tooth Enamel (White), 1.0 = Gingiva (Coral Pink)

    if (isUpper) {
      // Upper Jaw: Teeth point DOWN (towards minY), Gums are UP (towards maxY)
      if (normY <= marginY) {
        // Enamel tooth crown (100% White)
        gumFactor = 0.0;
      } else if (normY >= marginY + 0.035) {
        // Gingiva mucosal tissue (100% Coral Pink)
        gumFactor = 1.0;
      } else {
        // Smooth crisp anatomical transition band
        const t = (normY - marginY) / 0.035;
        gumFactor = t * t * (3 - 2 * t);
      }

      // Preserve all orthodontic attachments on upper tooth faces
      if (normY < marginY + 0.08 && zProgress > 0.12 && Math.abs(ny) < 0.60) {
        gumFactor = 0.0;
      }
    } else {
      // Lower Jaw: Teeth point UP (towards maxY), Gums are DOWN (towards minY)
      const lowerMarginY = 1.0 - marginY;

      if (normY >= lowerMarginY) {
        // Enamel tooth crown (100% White)
        gumFactor = 0.0;
      } else if (normY <= lowerMarginY - 0.035) {
        // Gingiva mucosal tissue (100% Coral Pink)
        gumFactor = 1.0;
      } else {
        // Smooth crisp anatomical transition band
        const t = (lowerMarginY - normY) / 0.035;
        gumFactor = t * t * (3 - 2 * t);
      }

      // Preserve all orthodontic attachments on lower tooth faces
      if (normY > lowerMarginY - 0.08 && zProgress > 0.12 && Math.abs(ny) < 0.60) {
        gumFactor = 0.0;
      }
    }

    // Gingival multi-tone depth gradient
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

    // Blend Colors
    const r = toothR * (1 - gumFactor) + finalGumR * gumFactor;
    const g = toothG * (1 - gumFactor) + finalGumG * gumFactor;
    const b = toothB * (1 - gumFactor) + finalGumB * gumFactor;

    const idx = i * 3;
    colors[idx] = r;
    colors[idx + 1] = g;
    colors[idx + 2] = b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}
