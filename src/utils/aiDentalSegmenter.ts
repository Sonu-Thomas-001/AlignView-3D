import * as THREE from 'three';

/**
 * 3D Curvature Valley-Line Dental Mesh Segmentation Engine (Path B)
 * Extracts the true 3D concave groove (cervical margin) on the mesh surface
 * and propagates enamel labels from occlusal seeds across the triangle adjacency graph.
 * 
 * Creates authentic scalloped tooth zeniths and interdental papilla with zero horizontal stripe artifacts.
 */
export function segmentDentalMeshAI(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower'
): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const minY = bbox.min.y;
  const maxY = bbox.max.y;
  const height = Math.max(0.001, maxY - minY);

  const pos = geometry.attributes.position;
  const count = pos.count;
  const triangleCount = Math.floor(count / 3);
  const colors = new Float32Array(count * 3);

  const isUpper = arch === 'upper';

  // 1. Calculate Triangle Face Normals & Centroids
  const triCentroids = new Float32Array(triangleCount * 3);
  const triNormals = new Float32Array(triangleCount * 3);
  const triLabels = new Uint8Array(triangleCount); // 0 = Gingiva, 1 = Tooth

  for (let t = 0; t < triangleCount; t++) {
    const i0 = t * 3;
    const i1 = i0 + 1;
    const i2 = i0 + 2;

    const x0 = pos.getX(i0), y0 = pos.getY(i0), z0 = pos.getZ(i0);
    const x1 = pos.getX(i1), y1 = pos.getY(i1), z1 = pos.getZ(i1);
    const x2 = pos.getX(i2), y2 = pos.getY(i2), z2 = pos.getZ(i2);

    triCentroids[t * 3] = (x0 + x1 + x2) / 3;
    triCentroids[t * 3 + 1] = (y0 + y1 + y2) / 3;
    triCentroids[t * 3 + 2] = (z0 + z1 + z2) / 3;

    const ax = x1 - x0, ay = y1 - y0, az = z1 - z0;
    const bx = x2 - x0, by = y2 - y0, bz = z2 - z0;
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;

    triNormals[t * 3] = nx / len;
    triNormals[t * 3 + 1] = ny / len;
    triNormals[t * 3 + 2] = nz / len;
  }

  // 2. Build Fast 3D Edge Adjacency Graph via Quantized Coordinates
  const edgeMap = new Map<string, number[]>();
  const QUANT_SCALE = 12.0; // ~0.08 mm precision

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

  const triNeighbors: number[][] = Array.from({ length: triangleCount }, () => []);
  edgeMap.forEach((tris) => {
    if (tris.length === 2) {
      triNeighbors[tris[0]].push(tris[1]);
      triNeighbors[tris[1]].push(tris[0]);
    }
  });

  // 3. Compute 3D Concave Valley Curvature for Every Triangle
  const triCurvature = new Float32Array(triangleCount);
  for (let t = 0; t < triangleCount; t++) {
    const cx = triCentroids[t * 3];
    const cy = triCentroids[t * 3 + 1];
    const cz = triCentroids[t * 3 + 2];
    const nx = triNormals[t * 3];
    const ny = triNormals[t * 3 + 1];
    const nz = triNormals[t * 3 + 2];

    const nbrs = triNeighbors[t];
    let maxConcavity = 0;
    for (let j = 0; j < nbrs.length; j++) {
      const n = nbrs[j];
      const dx = triCentroids[n * 3] - cx;
      const dy = triCentroids[n * 3 + 1] - cy;
      const dz = triCentroids[n * 3 + 2] - cz;
      const concavity = dx * nx + dy * ny + dz * nz;
      if (concavity > maxConcavity) maxConcavity = concavity;
    }
    triCurvature[t] = maxConcavity;
  }

  // 4. Geodesic Crease Flood-Fill from True Cusp Seeds
  const queue: number[] = [];
  for (let t = 0; t < triangleCount; t++) {
    const cy = triCentroids[t * 3 + 1];
    if (isUpper && cy < minY + height * 0.28) {
      triLabels[t] = 1;
      queue.push(t);
    }
    if (!isUpper && cy > maxY - height * 0.28) {
      triLabels[t] = 1;
      queue.push(t);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cy = triCentroids[curr * 3 + 1];
    const ny = triNormals[curr * 3 + 1];

    const nbrs = triNeighbors[curr];
    for (let j = 0; j < nbrs.length; j++) {
      const next = nbrs[j];
      if (triLabels[next] !== 0) continue;

      const ncy = triCentroids[next * 3 + 1];
      const nny = triNormals[next * 3 + 1];

      const distRatio = isUpper ? (ncy - minY) / height : (maxY - ncy) / height;

      // Stop expansion at the physical 3D concave trench (cervical margin)
      if (distRatio > 0.35) {
        if (triCurvature[next] > 0.08) continue; // Concave valley crease!
        if (isUpper && nny > 0.45 && ny < 0.20) continue; // Gum mucosal slope
        if (!isUpper && nny < -0.45 && ny > -0.20) continue;
      }
      if (distRatio > 0.50) continue; // Absolute crown anatomical limit

      triLabels[next] = 1; // Mark as Tooth
      queue.push(next);
    }
  }

  // 5. Morphological Relaxation (eliminates isolated pinholes)
  for (let t = 0; t < triangleCount; t++) {
    const nbrs = triNeighbors[t];
    if (nbrs.length < 2) continue;
    let toothVotes = 0;
    for (let j = 0; j < nbrs.length; j++) {
      if (triLabels[nbrs[j]] === 1) toothVotes++;
    }
    if (toothVotes === nbrs.length) triLabels[t] = 1;
    else if (toothVotes === 0) triLabels[t] = 0;
  }

  // 6. Assign Exact Anatomical Colors
  // Teeth Enamel: Pure Pearlescent White (#FFFFFF)
  const toothR = 1.000, toothG = 1.000, toothB = 1.000;

  // Gingiva: Rich Saturated Warm Coral-Rose (#D86B78 / #CF5D6C with deep vascular base #B54352)
  const gumMarginR = 0.865, gumMarginG = 0.445, gumMarginB = 0.500;
  const gumBodyR = 0.810, gumBodyG = 0.365, gumBodyB = 0.425;
  const gumDeepR = 0.710, gumDeepG = 0.265, gumDeepB = 0.325;

  for (let t = 0; t < triangleCount; t++) {
    const isTooth = triLabels[t] === 1;
    const cy = triCentroids[t * 3 + 1];
    const normY = (cy - minY) / height;

    const baseDist = isUpper ? Math.max(0, normY - 0.65) / 0.35 : Math.max(0, 0.35 - normY) / 0.35;
    const neckDist = isUpper ? Math.max(0, 0.75 - normY) / 0.25 : Math.max(0, normY - 0.25) / 0.25;

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
