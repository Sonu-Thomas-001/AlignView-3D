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
 * Approach 3: 3D Dihedral Angle & Concave Edge Crease Segmentation Algorithm
 * Segregates teeth from gingiva by identifying the physical 3D concave groove (cervical margin)
 * and propagating tooth enamel labels from occlusal seeds across the triangle adjacency graph.
 */
export function applyAnatomicalDentalColors(geometry: THREE.BufferGeometry, arch: 'upper' | 'lower'): THREE.BufferGeometry {
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
  const normals = geometry.attributes.normal;
  const count = pos.count;
  const triangleCount = Math.floor(count / 3);
  const colors = new Float32Array(count * 3);

  const isUpper = arch === 'upper';

  // 1. Calculate Triangle Face Normals & Centroids
  const triCentroids = new Float32Array(triangleCount * 3);
  const triNormals = new Float32Array(triangleCount * 3);
  const triLabels = new Uint8Array(triangleCount); // 0 = unassigned/gum, 1 = tooth

  for (let t = 0; t < triangleCount; t++) {
    const i0 = t * 3;
    const i1 = i0 + 1;
    const i2 = i0 + 2;

    const x0 = pos.getX(i0), y0 = pos.getY(i0), z0 = pos.getZ(i0);
    const x1 = pos.getX(i1), y1 = pos.getY(i1), z1 = pos.getZ(i1);
    const x2 = pos.getX(i2), y2 = pos.getY(i2), z2 = pos.getZ(i2);

    // Centroid
    const cx = (x0 + x1 + x2) / 3;
    const cy = (y0 + y1 + y2) / 3;
    const cz = (z0 + z1 + z2) / 3;

    triCentroids[t * 3] = cx;
    triCentroids[t * 3 + 1] = cy;
    triCentroids[t * 3 + 2] = cz;

    // Face Normal via cross product
    const ax = x1 - x0, ay = y1 - y0, az = z1 - z0;
    const bx = x2 - x0, by = y2 - y0, bz = z2 - z0;

    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;

    nx /= len;
    ny /= len;
    nz /= len;

    triNormals[t * 3] = nx;
    triNormals[t * 3 + 1] = ny;
    triNormals[t * 3 + 2] = nz;
  }

  // 2. Build Triangle Edge Adjacency via Quantized Vertex Hashing
  // Quantize vertex coordinates to 0.05 mm precision to connect adjacent STL triangle edges
  const edgeMap = new Map<string, number[]>();
  const QUANT_SCALE = 20.0; // 0.05 mm resolution

  const getVertexHash = (x: number, y: number, z: number) => {
    const qx = Math.round(x * QUANT_SCALE);
    const qy = Math.round(y * QUANT_SCALE);
    const qz = Math.round(z * QUANT_SCALE);
    return `${qx}_${qy}_${qz}`;
  };

  const getEdgeKey = (h1: string, h2: string) => {
    return h1 < h2 ? `${h1}|${h2}` : `${h2}|${h1}`;
  };

  for (let t = 0; t < triangleCount; t++) {
    const i0 = t * 3;
    const i1 = i0 + 1;
    const i2 = i0 + 2;

    const h0 = getVertexHash(pos.getX(i0), pos.getY(i0), pos.getZ(i0));
    const h1 = getVertexHash(pos.getX(i1), pos.getY(i1), pos.getZ(i1));
    const h2 = getVertexHash(pos.getX(i2), pos.getY(i2), pos.getZ(i2));

    const e01 = getEdgeKey(h0, h1);
    const e12 = getEdgeKey(h1, h2);
    const e20 = getEdgeKey(h2, h0);

    let list = edgeMap.get(e01);
    if (!list) edgeMap.set(e01, [t]);
    else if (list.length < 2) list.push(t);

    list = edgeMap.get(e12);
    if (!list) edgeMap.set(e12, [t]);
    else if (list.length < 2) list.push(t);

    list = edgeMap.get(e20);
    if (!list) edgeMap.set(e20, [t]);
    else if (list.length < 2) list.push(t);
  }

  // Build triangle adjacency list
  const triNeighbors: number[][] = Array.from({ length: triangleCount }, () => []);
  edgeMap.forEach((tris) => {
    if (tris.length === 2) {
      triNeighbors[tris[0]].push(tris[1]);
      triNeighbors[tris[1]].push(tris[0]);
    }
  });

  // 3. Occlusal Surface Height-Field for Local Tooth Crown Depth
  const GRID_RES = 64;
  const gridTips = new Float32Array(GRID_RES * GRID_RES);
  gridTips.fill(isUpper ? 1e9 : -1e9);

  for (let t = 0; t < triangleCount; t++) {
    const cx = triCentroids[t * 3];
    const cy = triCentroids[t * 3 + 1];
    const cz = triCentroids[t * 3 + 2];

    const gx = Math.min(GRID_RES - 1, Math.max(0, Math.floor(((cx - minX) / sizeX) * GRID_RES)));
    const gz = Math.min(GRID_RES - 1, Math.max(0, Math.floor(((cz - minZ) / sizeZ) * GRID_RES)));
    const gIdx = gz * GRID_RES + gx;

    if (isUpper) {
      if (cy < gridTips[gIdx]) gridTips[gIdx] = cy;
    } else {
      if (cy > gridTips[gIdx]) gridTips[gIdx] = cy;
    }
  }

  // 4. Seed Initialization & Geodesic Crease Flood-Fill (BFS)
  const queue: number[] = [];

  for (let t = 0; t < triangleCount; t++) {
    const cy = triCentroids[t * 3 + 1];
    const ny = triNormals[t * 3 + 1];

    if (isUpper) {
      // Upper Tooth Seeds: Lowest occlusal triangles
      if (cy < minY + height * 0.28 && ny < 0.40) {
        triLabels[t] = 1;
        queue.push(t);
      }
    } else {
      // Lower Tooth Seeds: Highest occlusal triangles
      if (cy > maxY - height * 0.28 && ny > -0.40) {
        triLabels[t] = 1;
        queue.push(t);
      }
    }
  }

  // Fast Geodesic Propagation across convex tooth mesh, blocked by concave dihedral creases
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = triCentroids[curr * 3];
    const cy = triCentroids[curr * 3 + 1];
    const cz = triCentroids[curr * 3 + 2];
    const cnx = triNormals[curr * 3];
    const cny = triNormals[curr * 3 + 1];
    const cnz = triNormals[curr * 3 + 2];

    const gx = Math.min(GRID_RES - 1, Math.max(0, Math.floor(((cx - minX) / sizeX) * GRID_RES)));
    const gz = Math.min(GRID_RES - 1, Math.max(0, Math.floor(((cz - minZ) / sizeZ) * GRID_RES)));
    const localTipY = gridTips[gz * GRID_RES + gx];

    const distFromTip = isUpper ? (cy - localTipY) : (localTipY - cy);
    const isAnterior = cz > (minZ + sizeZ * 0.38);
    const maxCrownDist = isAnterior ? (height * 0.65) : (height * 0.52);

    const neighbors = triNeighbors[curr];
    for (let j = 0; j < neighbors.length; j++) {
      const next = neighbors[j];
      if (triLabels[next] !== 0) continue;

      const ncy = triCentroids[next * 3 + 1];
      const nny = triNormals[next * 3 + 1];
      const nnx = triNormals[next * 3];
      const nnz = triNormals[next * 3 + 2];

      // Base cut barrier: flat base cut is always GUM
      if (isUpper && (ncy > maxY - height * 0.10 || nny > 0.82)) continue;
      if (!isUpper && (ncy < minY + height * 0.10 || nny < -0.82)) continue;

      // Maximum Anatomical Crown Barrier
      const nextDist = isUpper ? (ncy - localTipY) : (localTipY - ncy);
      if (nextDist > maxCrownDist) continue;

      // 3D Dihedral Concavity Crease Detection:
      // Vector from current triangle center to neighbor triangle center
      const dx = triCentroids[next * 3] - cx;
      const dy = ncy - cy;
      const dz = triCentroids[next * 3 + 2] - cz;

      // Concavity test: dot product with current face normal
      const concavity = dx * cnx + dy * cny + dz * cnz;
      const normalDot = cnx * nnx + cny * nny + cnz * nnz;

      // If concave crevice is sharp (cervical margin sulcus) near the crown boundary, stop propagation
      if (nextDist > (maxCrownDist * 0.65)) {
        if (isUpper && (nny > 0.45 && cny < 0.15)) continue; // Inward gum slope
        if (!isUpper && (nny < -0.45 && cny > -0.15)) continue; // Inward gum slope
        if (concavity > 0.08 && normalDot < 0.70) continue; // Sharp concave groove
      }

      triLabels[next] = 1; // Mark as Tooth
      queue.push(next);
    }
  }

  // 5. Apply Anatomical Vertex Colors
  // Teeth: Pure Pearlescent White (#FFFFFF)
  const toothR = 1.000, toothG = 1.000, toothB = 1.000;

  // Gingiva: Rich Saturated Warm Coral-Rose (#D86B78 / #CF5D6C with deep base #B54352)
  const gumMarginR = 0.865, gumMarginG = 0.445, gumMarginB = 0.500;
  const gumBodyR = 0.810, gumBodyG = 0.365, gumBodyB = 0.425;
  const gumDeepR = 0.710, gumDeepG = 0.265, gumDeepB = 0.325;

  for (let t = 0; t < triangleCount; t++) {
    const isTooth = triLabels[t] === 1;
    const cy = triCentroids[t * 3 + 1];
    const normY = (cy - minY) / height;

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

    const r = isTooth ? toothR : finalGumR;
    const g = isTooth ? toothG : finalGumG;
    const b = isTooth ? toothB : finalGumB;

    for (let v = 0; v < 3; v++) {
      const idx = (t * 3 + v) * 3;
      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}
