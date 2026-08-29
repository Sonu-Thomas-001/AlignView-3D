import * as THREE from 'three';
import { STLFileInfo } from '@/types/dental';

export interface ParsedSTLMeta {
  arch: 'upper' | 'lower' | 'unknown';
  stage?: number;
  patientName?: string;
  cleanName: string;
}

/**
 * Parses a single STL filename to determine arch type (upper/lower),
 * treatment stage number, and patient name.
 */
export function parseSTLFilename(filename: string): ParsedSTLMeta {
  // Strip extension
  const baseName = filename.replace(/\.stl$/i, '').trim();

  let arch: 'upper' | 'lower' | 'unknown' = 'unknown';
  let stage: number | undefined = undefined;
  let patientName: string | undefined = undefined;

  // 1. Detect Arch Type
  const upperPattern = /\b(upper\s*jaw|upperjaw|upper|maxillary|maxilla|max)\b|([_\-\s]u\d+)|(^u\d+)/i;
  const lowerPattern = /\b(lower\s*jaw|lowerjaw|lower|mandibular|mandible|mand)\b|([_\-\s]l\d+)|(^l\d+)/i;

  const upperMatch = baseName.match(upperPattern);
  const lowerMatch = baseName.match(lowerPattern);

  if (upperMatch && !lowerMatch) {
    arch = 'upper';
  } else if (lowerMatch && !upperMatch) {
    arch = 'lower';
  } else if (upperMatch && lowerMatch) {
    // Whichever match appears first or is more specific
    arch = upperMatch.index! <= lowerMatch.index! ? 'upper' : 'lower';
  }

  // 2. Extract Stage Number
  // Pattern A: " - 22 - " or " - 02 - " (e.g., "Krishnapriya Upper jaw - 22 - Model")
  const hyphenStageMatch = baseName.match(/[-_]\s*(\d{1,3})\s*[-_]/);
  if (hyphenStageMatch) {
    stage = parseInt(hyphenStageMatch[1], 10);
  }

  // Pattern B: "Stage 05", "Step 12", "Aligner 3", "S02"
  if (stage === undefined) {
    const stageKeywordMatch = baseName.match(/(?:stage|step|aligner|align|stg|st|s)[\s_\-#]*(\d{1,3})\b/i);
    if (stageKeywordMatch) {
      stage = parseInt(stageKeywordMatch[1], 10);
    }
  }

  // Pattern C: "U05", "L12", "Upper_08", "Lower_15"
  if (stage === undefined) {
    const uOrLMatch = baseName.match(/(?:[_\-\s]|^)[ul](\d{1,3})\b/i);
    if (uOrLMatch) {
      stage = parseInt(uOrLMatch[1], 10);
    }
  }

  // Pattern D: Trailing number or isolated number
  if (stage === undefined) {
    const isolatedNumMatch = baseName.match(/(?:^|\s|[_\-])(\d{1,3})(?:$|\s|[_\-])/);
    if (isolatedNumMatch) {
      stage = parseInt(isolatedNumMatch[1], 10);
    }
  }

  // 3. Extract Patient Name
  // Look for text prefix preceding the arch indicator or stage marker
  const splitKeywords = /(?:\s*[-_]?\s*(?:upper\s*jaw|lower\s*jaw|upperjaw|lowerjaw|upper|lower|maxillary|mandibular|maxilla|mandible|stage|step|aligner|model)[-_]?\s*)/i;
  const parts = baseName.split(splitKeywords);

  if (parts.length > 0 && parts[0].trim().length > 1) {
    let candidate = parts[0]
      .replace(/[-_]+$/, '')
      .replace(/^[-_]+/, '')
      .trim();

    // Avoid taking generic words as patient names
    const genericWords = /^(model|scan|arch|jaw|treatment|setup|aligner|stl|export|case|patient)$/i;
    if (candidate && !genericWords.test(candidate) && !/^\d+$/.test(candidate)) {
      patientName = candidate;
    }
  }

  return {
    arch,
    stage,
    patientName,
    cleanName: baseName,
  };
}

/**
 * Given a list of filenames from a batch upload, discovers the consensus Patient Name.
 */
export function detectBatchPatientName(filenames: string[]): string | undefined {
  if (filenames.length === 0) return undefined;

  const namesCount = new Map<string, number>();

  for (const name of filenames) {
    const parsed = parseSTLFilename(name);
    if (parsed.patientName) {
      const trimmed = parsed.patientName.trim();
      namesCount.set(trimmed, (namesCount.get(trimmed) || 0) + 1);
    }
  }

  let bestName: string | undefined = undefined;
  let maxCount = 0;

  namesCount.forEach((count, name) => {
    if (count > maxCount) {
      maxCount = count;
      bestName = name;
    }
  });

  return bestName;
}

/**
 * Sorts STL files sequentially by their stage number.
 */
export function sortSTLFilesByStage(files: STLFileInfo[]): STLFileInfo[] {
  return [...files].sort((a, b) => {
    const stageA = a.stage ?? 999;
    const stageB = b.stage ?? 999;
    if (stageA !== stageB) return stageA - stageB;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Automatically normalizes imported dental mesh orientation into standard Three.js dental studio coordinates:
 * - X: Transverse / Left-Right (Arch width)
 * - Y: Vertical / Superior-Inferior (Height)
 * - Z: Sagittal / Anterior-Posterior (Incisors at +Z, Molars at -Z)
 */
export function normalizeDentalGeometry(geometry: THREE.BufferGeometry, arch: 'upper' | 'lower'): THREE.BufferGeometry {
  geometry.computeVertexNormals();
  geometry.center();

  // 1. Check initial bounding box
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const size = new THREE.Vector3();
  bbox.getSize(size);

  // Dental scan dimensions:
  // Height (Y) is always the smallest axis (~12 - 28 mm)
  // Width (X) and Depth (Z) are larger (~45 - 75 mm)
  if (size.z < size.x && size.z < size.y) {
    // Height is in Z axis (CAD software export with Z-up) -> rotate into Y
    geometry.rotateX(-Math.PI / 2);
  } else if (size.x < size.y && size.x < size.z) {
    // Height is in X axis -> rotate into Y
    geometry.rotateZ(Math.PI / 2);
  }

  geometry.computeBoundingBox();
  const sizeAfterHeight = new THREE.Vector3();
  geometry.boundingBox!.getSize(sizeAfterHeight);

  // 2. Align Anterior (Incisors at front +Z) vs Posterior (Molars at back -Z)
  // In a dental arch, the anterior incisor region is narrower in X than the posterior molar region
  const pos = geometry.attributes.position;
  let frontWidth = 0;
  let frontCount = 0;
  let backWidth = 0;
  let backCount = 0;

  const halfDepth = sizeAfterHeight.z * 0.25;

  for (let i = 0; i < pos.count; i += 6) {
    const x = Math.abs(pos.getX(i));
    const z = pos.getZ(i);

    if (z > halfDepth) {
      frontWidth += x;
      frontCount++;
    } else if (z < -halfDepth) {
      backWidth += x;
      backCount++;
    }
  }

  const avgFrontX = frontCount > 0 ? frontWidth / frontCount : 0;
  const avgBackX = backCount > 0 ? backWidth / backCount : 0;

  // If front is wider than back, arch is facing backwards -> rotate 180 deg around Y
  if (avgFrontX > avgBackX && backCount > 10) {
    geometry.rotateY(Math.PI);
  }

  // 3. Occlusal Plane Orientation (Crowns vs Base)
  // For Upper Arch: Teeth crowns should point DOWN (towards -Y, occlusal contact), base on top (+Y)
  // For Lower Arch: Teeth crowns should point UP (towards +Y, occlusal contact), base on bottom (-Y)
  // We check the curvature / surface normals or vertex density near the occlusal edges vs the flat base cut:
  let topCuspCount = 0;
  let bottomCuspCount = 0;
  const halfHeight = sizeAfterHeight.y * 0.25;

  for (let i = 0; i < pos.count; i += 6) {
    const y = pos.getY(i);
    if (y > halfHeight) topCuspCount++;
    else if (y < -halfHeight) bottomCuspCount++;
  }

  // If upper arch has base at bottom instead of top, flip it around X
  // Dental crowns have more detailed/higher surface area than flat horseshoe bases
  if (arch === 'upper') {
    // In upper jaw, crowns point down (-Y) and gums/base are up (+Y)
    // If crowns are currently facing up, flip X
    if (topCuspCount > bottomCuspCount * 1.4) {
      geometry.rotateX(Math.PI);
      geometry.rotateY(Math.PI); // keep front facing forward
    }
  } else {
    // In lower jaw, crowns point up (+Y) and base is down (-Y)
    if (bottomCuspCount > topCuspCount * 1.4) {
      geometry.rotateX(Math.PI);
      geometry.rotateY(Math.PI);
    }
  }

  geometry.computeVertexNormals();
  geometry.center();

  // 4. Apply Realistic Anatomical Vertex Colors (Coral Pink Gums + Pearlescent White Teeth)
  applyAnatomicalDentalColors(geometry, arch);

  return geometry;
}

/**
 * Generates natural anatomical two-tone vertex colors (Coral-Rose Gingiva and Pearlescent Enamel Teeth)
 * with natural scalloped cervical gumline contours, matching clinical dental 3D reference renders (Image 2).
 */
export function applyAnatomicalDentalColors(geometry: THREE.BufferGeometry, arch: 'upper' | 'lower'): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const minY = bbox.min.y;
  const maxY = bbox.max.y;
  const height = Math.max(0.001, maxY - minY);
  const sizeZ = Math.max(0.001, bbox.max.z - bbox.min.z);

  const pos = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const colors = new Float32Array(pos.count * 3);

  // Exact Anatomical Color Palette sampled from Reference Image 2:
  // 1. Teeth Enamel: Pure lustrous pearl white
  const toothR = 1.000;
  const toothG = 1.000;
  const toothB = 1.000;

  // 2. Gingiva (Gums): Rich saturated warm coral-rose (matching Image 2)
  const gumMarginR = 0.865; // #DC7280 (Free gingival margin)
  const gumMarginG = 0.445;
  const gumMarginB = 0.500;

  const gumBodyR = 0.810;   // #CF5D6C (Attached gingiva body)
  const gumBodyG = 0.365;
  const gumBodyB = 0.425;

  const gumDeepR = 0.710;   // #B54352 (Deep alveolar base cut)
  const gumDeepG = 0.265;
  const gumDeepB = 0.325;

  const isUpper = arch === 'upper';

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Surface normal components
    const ny = normals ? normals.getY(i) : 0;
    const nz = normals ? normals.getZ(i) : 1;

    // Normalized vertical height: 0.0 (occlusal bottom for upper) to 1.0 (base top for upper)
    const normY = (y - minY) / height;

    // Arch angle theta: 0 is anterior center (incisors), +/- 1.2+ is posterior (molars)
    const theta = Math.atan2(z, x);

    // Anatomical crown height profiling:
    // - Anterior (Incisors & Canines, front): crowns extend high
    // - Posterior (Premolars & Molars, back): crowns are shorter
    const isAnterior = z > (bbox.min.z + sizeZ * 0.38);

    let gumFactor = 0; // 0.0 = pure tooth enamel (white), 1.0 = pure gingiva (coral-rose)

    if (isUpper) {
      // Upper Jaw: Teeth crowns at bottom (-Y, normY < gumline), Gums at top (+Y, normY > gumline)
      const crownBaseline = isAnterior ? 0.58 : 0.48;
      
      // Use surface normal to follow natural physical 3D curvature:
      // Teeth face outward/downward (ny < 0.1), while gingiva slopes upward towards base (ny > 0.25)
      const curvatureOffset = ny * 0.07;
      const adjustedY = normY - curvatureOffset;

      const transitionWidth = 0.022;

      if (normY > 0.88 || ny > 0.82) {
        // Flat upper model base cut is always 100% gingiva
        gumFactor = 1.0;
      } else if (adjustedY >= crownBaseline + transitionWidth) {
        gumFactor = 1.0;
      } else if (adjustedY <= crownBaseline - transitionWidth) {
        gumFactor = 0.0;
      } else {
        const t = (adjustedY - (crownBaseline - transitionWidth)) / (2 * transitionWidth);
        gumFactor = t * t * (3 - 2 * t);
      }

      // Preserve orthodontic attachments and incisal edges
      if (normY < 0.62 && (ny < -0.1 || nz > 0.55)) {
        gumFactor *= 0.1;
      }
    } else {
      // Lower Jaw: Gums at bottom (-Y, normY < gumline), Teeth crowns at top (+Y, normY > gumline)
      const crownBaseline = isAnterior ? 0.48 : 0.54;

      // Lower teeth face outward/upward (ny > -0.1), while lower gingiva slopes downward towards base (ny < -0.25)
      const curvatureOffset = ny * 0.07;
      const adjustedY = normY - curvatureOffset;

      const transitionWidth = 0.022;

      if (normY < 0.12 || ny < -0.82) {
        // Flat lower model base cut is always 100% gingiva
        gumFactor = 1.0;
      } else if (adjustedY <= crownBaseline - transitionWidth) {
        gumFactor = 1.0;
      } else if (adjustedY >= crownBaseline + transitionWidth) {
        gumFactor = 0.0;
      } else {
        const t = ((crownBaseline + transitionWidth) - adjustedY) / (2 * transitionWidth);
        gumFactor = t * t * (3 - 2 * t);
      }

      // Preserve orthodontic attachments on lower teeth
      if (normY > 0.38 && (ny > 0.1 || nz > 0.55)) {
        gumFactor *= 0.1;
      }
    }

    // Gingival multi-tone depth gradient (matches Image 2 shading):
    // Near tooth neck: lighter healthy coral-rose (gumMargin)
    // Mid gum tissue: rich anatomical rose body (gumBody)
    // Far base cut: deep vascular coral (gumDeep)
    const baseDist = isUpper ? Math.max(0, normY - 0.70) / 0.30 : Math.max(0, 0.30 - normY) / 0.30;
    const neckDist = isUpper ? Math.max(0, 0.80 - normY) / 0.25 : Math.max(0, normY - 0.20) / 0.25;

    let finalGumR = gumBodyR;
    let finalGumG = gumBodyG;
    let finalGumB = gumBodyB;

    if (baseDist > 0) {
      finalGumR = gumBodyR * (1 - baseDist) + gumDeepR * baseDist;
      finalGumG = gumBodyG * (1 - baseDist) + gumDeepG * baseDist;
      finalGumB = gumBodyB * (1 - baseDist) + gumDeepB * baseDist;
    } else if (neckDist > 0) {
      finalGumR = gumBodyR * (1 - neckDist * 0.4) + gumMarginR * (neckDist * 0.4);
      finalGumG = gumBodyG * (1 - neckDist * 0.4) + gumMarginG * (neckDist * 0.4);
      finalGumB = gumBodyB * (1 - neckDist * 0.4) + gumMarginB * (neckDist * 0.4);
    }

    // Composite Final Color: blend pure enamel white with rich coral gingiva
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
