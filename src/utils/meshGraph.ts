import * as THREE from 'three';

/**
 * Real mesh topology, recovered from the triangle soup an STL is.
 *
 * An STL has no vertices, only triangles: three positions each, so a vertex shared by six
 * triangles is stored six times over and nothing in the file says they are the same point.
 * Anything that reasons about the *surface* rather than about individual triangles - which
 * neighbours a point has, whether a region is connected, how a value spreads across it -
 * needs those copies merged first. Without that every triangle is its own island.
 */
export interface WeldedMesh {
  vertexCount: number;
  /** Merged positions, 3 per vertex. */
  positions: Float32Array;
  /** Unit vertex normals, area-weighted, pointing out of the solid. */
  normals: Float32Array;
  triangleCount: number;
  /** Welded vertex ids, 3 per triangle, in the geometry's own triangle order. */
  triangles: Uint32Array;
  /** CSR adjacency: vertex v's neighbours are `neighbors[neighborStart[v] .. [v + 1]]`. */
  neighborStart: Uint32Array;
  neighbors: Uint32Array;
  /** Geometry corner index -> welded vertex id, to map a per-vertex result back. */
  weldedOf: Uint32Array;
}

/**
 * A micron, as the grid positions are snapped to before being compared.
 *
 * Scan meshes duplicate their vertices exactly, so an exact comparison would do - but a
 * tolerance costs nothing and covers the case where a stage has been through a transform that
 * left the copies differing in the last bit. It is four orders of magnitude below the mean
 * edge length of these scans, so it cannot merge two points that are genuinely distinct.
 */
const WELD_MM = 0.001;

/**
 * Half the span of the integer grid, per axis.
 *
 * Positions are snapped to `WELD_MM` and packed into a single integer key rather than a string:
 * 17 bits per axis is 51 bits in total, which a double holds exactly, so the key is a real
 * identity and not a hash that has to be checked for collisions. It covers +/-65 mm about the
 * origin, and an arch normalised onto its own bounding-box centre spans a third of that.
 */
const GRID_SPAN = 131072;
const GRID_HALF = 65536;

/** Merges duplicate vertices and builds the vertex adjacency of the surface. */
export function weldGeometry(geometry: THREE.BufferGeometry): WeldedMesh {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const index = geometry.index;
  const cornerCount = index ? index.count : position.count;
  const triangleCount = Math.floor(cornerCount / 3);

  const ids = new Map<number, number>();
  const weldedOf = new Uint32Array(cornerCount);
  const positions = new Float32Array(cornerCount * 3);
  let vertexCount = 0;

  for (let corner = 0; corner < cornerCount; corner++) {
    const source = index ? index.getX(corner) : corner;
    const x = position.getX(source);
    const y = position.getY(source);
    const z = position.getZ(source);
    const key =
      ((Math.round(x / WELD_MM) + GRID_HALF) * GRID_SPAN +
        (Math.round(y / WELD_MM) + GRID_HALF)) * GRID_SPAN +
      (Math.round(z / WELD_MM) + GRID_HALF);

    let id = ids.get(key);
    if (id === undefined) {
      id = vertexCount++;
      ids.set(key, id);
      positions[id * 3] = x;
      positions[id * 3 + 1] = y;
      positions[id * 3 + 2] = z;
    }
    weldedOf[corner] = id;
  }

  const triangles = new Uint32Array(weldedOf);

  // Adjacency, in two passes: count each triangle's six directed edges per vertex, then fill
  // and compact. A closed manifold lists every undirected edge twice, so the raw lists hold
  // duplicates; sorting each vertex's own slice is what removes them, and it keeps the
  // neighbour lists ordered, which makes them cheap to compare later.
  const degree = new Uint32Array(vertexCount + 1);
  for (let t = 0; t < triangleCount; t++) {
    const a = triangles[t * 3];
    const b = triangles[t * 3 + 1];
    const c = triangles[t * 3 + 2];
    if (a === b || b === c || a === c) continue;
    degree[a] += 2;
    degree[b] += 2;
    degree[c] += 2;
  }

  const rawStart = new Uint32Array(vertexCount + 1);
  for (let v = 0; v < vertexCount; v++) rawStart[v + 1] = rawStart[v] + degree[v];
  const raw = new Uint32Array(rawStart[vertexCount]);
  const cursor = new Uint32Array(rawStart.subarray(0, vertexCount));

  for (let t = 0; t < triangleCount; t++) {
    const a = triangles[t * 3];
    const b = triangles[t * 3 + 1];
    const c = triangles[t * 3 + 2];
    if (a === b || b === c || a === c) continue;
    raw[cursor[a]++] = b; raw[cursor[a]++] = c;
    raw[cursor[b]++] = a; raw[cursor[b]++] = c;
    raw[cursor[c]++] = a; raw[cursor[c]++] = b;
  }

  const neighborStart = new Uint32Array(vertexCount + 1);
  const neighbors = new Uint32Array(raw.length);
  let write = 0;
  for (let v = 0; v < vertexCount; v++) {
    neighborStart[v] = write;
    const slice = raw.subarray(rawStart[v], rawStart[v + 1]);
    slice.sort();
    let previous = -1;
    for (const u of slice) {
      if (u === previous) continue;
      previous = u;
      neighbors[write++] = u;
    }
  }
  neighborStart[vertexCount] = write;

  return {
    vertexCount,
    positions: positions.subarray(0, vertexCount * 3),
    normals: vertexNormals(positions, triangles, triangleCount, vertexCount),
    triangleCount,
    triangles,
    neighborStart,
    neighbors: neighbors.subarray(0, write),
    weldedOf,
  };
}

/**
 * Area-weighted vertex normals, turned to point out of the solid.
 *
 * Weighting by area rather than averaging unit face normals is what keeps a normal meaningful
 * where the triangulation is uneven, which around a scanned gingival margin it always is: a
 * dozen slivers on one side would otherwise outvote one large triangle on the other.
 *
 * Which way is out is decided once for the whole mesh, from the sign of the enclosed volume,
 * rather than trusted per triangle. These scans are closed and consistently wound, so one
 * global test settles it; if a mesh ever arrives inconsistently wound the volume collapses
 * toward zero and the sign becomes arbitrary, which is a mesh problem no local rule can fix.
 */
function vertexNormals(
  positions: Float32Array,
  triangles: Uint32Array,
  triangleCount: number,
  vertexCount: number,
): Float32Array {
  const normals = new Float32Array(vertexCount * 3);
  let signedVolume = 0;

  for (let t = 0; t < triangleCount; t++) {
    const a = triangles[t * 3] * 3;
    const b = triangles[t * 3 + 1] * 3;
    const c = triangles[t * 3 + 2] * 3;

    const abx = positions[b] - positions[a];
    const aby = positions[b + 1] - positions[a + 1];
    const abz = positions[b + 2] - positions[a + 2];
    const acx = positions[c] - positions[a];
    const acy = positions[c + 1] - positions[a + 1];
    const acz = positions[c + 2] - positions[a + 2];

    // Twice the area, times the unit normal.
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    for (const corner of [a, b, c]) {
      normals[corner] += nx;
      normals[corner + 1] += ny;
      normals[corner + 2] += nz;
    }

    signedVolume += (
      positions[a] * (positions[b + 1] * positions[c + 2] - positions[b + 2] * positions[c + 1]) +
      positions[a + 1] * (positions[b + 2] * positions[c] - positions[b] * positions[c + 2]) +
      positions[a + 2] * (positions[b] * positions[c + 1] - positions[b + 1] * positions[c])
    ) / 6;
  }

  const outward = signedVolume >= 0 ? 1 : -1;
  for (let v = 0; v < vertexCount; v++) {
    const i = v * 3;
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
    if (length === 0) continue;
    const scale = outward / length;
    normals[i] *= scale;
    normals[i + 1] *= scale;
    normals[i + 2] *= scale;
  }
  return normals;
}

/**
 * How concave the surface is at each vertex: positive in a valley, negative on a bulge.
 *
 * Each neighbour is asked which side of the tangent plane it lies on, as the cosine between the
 * outward normal and the direction to it. On a bulge every neighbour falls away from the normal
 * and the mean is negative; in a crease they rise past it and the mean is positive. The
 * magnitude is a curvature scaled by the edge length, which is what makes it comparable across
 * the mesh: these scans are near-uniformly triangulated at about a fifth of a millimetre.
 *
 * This is the signal the gingival margin actually is. A tooth meets gum in a groove that runs
 * all the way around it - the one a probe follows - and no height rule can find it, because the
 * height it sits at is different on the cheek side, between the teeth, and on the tongue side of
 * the same tooth.
 */
export function concavityField(mesh: WeldedMesh): Float32Array {
  const { vertexCount, positions, normals, neighborStart, neighbors } = mesh;
  const field = new Float32Array(vertexCount);

  for (let v = 0; v < vertexCount; v++) {
    const i = v * 3;
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];
    let sum = 0;
    let count = 0;
    for (let e = neighborStart[v]; e < neighborStart[v + 1]; e++) {
      const j = neighbors[e] * 3;
      const dx = positions[j] - positions[i];
      const dy = positions[j + 1] - positions[i + 1];
      const dz = positions[j + 2] - positions[i + 2];
      const length = Math.hypot(dx, dy, dz);
      if (length === 0) continue;
      sum += (nx * dx + ny * dy + nz * dz) / length;
      count++;
    }
    field[v] = count > 0 ? sum / count : 0;
  }
  return field;
}

/**
 * Averages a per-vertex field with its neighbours, in place of a fixed-radius blur.
 *
 * Curvature read off single edges is dominated by scanner noise, and the crease that matters is
 * a millimetre or so wide - several passes across a fifth-millimetre mesh. Iterating the
 * one-ring average spreads over that width while following the surface, which a spatial blur
 * would not: on the two sides of a thin interdental papilla, points a fraction of a millimetre
 * apart in space are millimetres apart across the surface, and must not be mixed.
 */
export function smoothField(mesh: WeldedMesh, field: Float32Array, passes: number): Float32Array {
  const { vertexCount, neighborStart, neighbors } = mesh;
  // Both buffers are ours, so the caller's field is left as it was and the two can be swapped
  // between passes without allocating one per pass.
  let current = new Float32Array(field);
  let next = new Float32Array(vertexCount);

  for (let pass = 0; pass < passes; pass++) {
    for (let v = 0; v < vertexCount; v++) {
      let sum = current[v];
      let count = 1;
      for (let e = neighborStart[v]; e < neighborStart[v + 1]; e++) {
        sum += current[neighbors[e]];
        count++;
      }
      next[v] = sum / count;
    }
    const swap = current;
    current = next;
    next = swap;
  }
  return current;
}

/**
 * Labels each vertex by which of the connected regions of `member` it belongs to, and returns
 * the size of each. Vertices outside `member` are labelled -1.
 *
 * Connectivity is the check a per-vertex rule cannot make on its own: crowns are one patch per
 * tooth and gum is one patch around them, so a classification that produces hundreds of specks
 * is wrong however good its averages look, and this is what finds them.
 */
export function connectedRegions(
  mesh: WeldedMesh,
  member: Uint8Array,
): { label: Int32Array; sizes: number[] } {
  const { vertexCount, neighborStart, neighbors } = mesh;
  const label = new Int32Array(vertexCount).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];

  for (let seed = 0; seed < vertexCount; seed++) {
    if (!member[seed] || label[seed] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    label[seed] = id;
    stack.push(seed);

    while (stack.length > 0) {
      const v = stack.pop()!;
      size++;
      for (let e = neighborStart[v]; e < neighborStart[v + 1]; e++) {
        const u = neighbors[e];
        if (member[u] && label[u] === -1) {
          label[u] = id;
          stack.push(u);
        }
      }
    }
    sizes.push(size);
  }
  return { label, sizes };
}
