import * as THREE from 'three';
import { disposeBoundsTreeFor } from './meshBvh';
import {
  weldGeometry,
  concavityField,
  smoothField,
  connectedRegions,
  type WeldedMesh,
} from './meshGraph';

/**
 * Splits an arch scan into crowns and gingiva, so the two can be coloured as enamel and gum.
 *
 * The boundary this looks for is the gingival margin: the groove that runs around each tooth
 * where it emerges from the gum. It is found as a groove, on the surface, because that is what
 * it is. The previous version of this file modelled it as a height instead - one margin level
 * per five degrees of arc, teeth above it and gum below - and every way that model was wrong
 * showed up in the picture at once: the margin of a real tooth is several millimetres lower
 * between the teeth than at the middle of one, so a single level per sector cannot follow it and
 * drew a jagged near-horizontal line; the same level had to serve the cheek side and the tongue
 * side, whose margins differ by millimetres; and on an upper arch the palate sits at about the
 * height of the crowns, so a height rule painted the whole palatal vault as enamel.
 *
 * What a correct split looks like on these models, for whoever checks this next: 83 to 87 per
 * cent of the *triangles* but only 44 to 45 per cent of the *area* are enamel, because a scanner
 * spends far more triangles on a cusp than on smooth gingiva - so a triangle count says almost
 * nothing about whether the answer is right and the area share says almost everything. The
 * crowns come out as one or two connected patches rather than one per tooth, because these scans
 * record the interproximal contacts closed. The buccal margin sits 7.1 to 8.7 mm apical of the
 * occlusal plane, which is a clinical crown height. These are aligner-stage exports, 13 to 16 mm
 * tall in total: crowns plus a few millimetres of gum collar, not a full impression.
 *
 * What replaces it:
 *
 *   1. weld the triangle soup into a real surface, so neighbours exist at all;
 *   2. measure concavity per vertex - the margin is a continuous concave loop around every
 *      tooth, papillae included, and it is far stronger than the scanner noise;
 *   3. seed the two regions only where the answer is certain: the occlusal-most part of each
 *      tooth, and the trimmed base and the surfaces that lie away from the teeth altogether;
 *   4. grow both fronts across the surface at a cost that rises steeply inside a crease, and
 *      take the boundary where they meet. Two fronts meet inside whatever is expensive to
 *      cross, which is precisely the margin;
 *   5. pull the boundary down onto the floor of the groove and take the fringe off it, because a
 *      cost is only paid once and leaves the edge free to wander over the noisy shoulder above;
 *   6. discard patches too small to be a tooth, and fill holes too small to be gum.
 *
 * Nothing here assumes a height, a tooth count, or an arch shape beyond which way is apical.
 */

/** Angular bins the margin depth is reported over. 96 bins is under four degrees each. */
const REPORT_BINS = 96;

/**
 * Smoothing passes over the raw concavity, at about a fifth of a millimetre per pass.
 *
 * Single-edge curvature is mostly scan noise, and the margin groove is roughly a millimetre
 * across, so the signal wanted is the average over a few passes. Far more than this and the
 * groove between two touching teeth - the narrowest thing that must survive - starts to fill in.
 */
const CONCAVITY_PASSES = 4;

/**
 * Concavity a crease has to exceed before it costs anything to cross.
 *
 * Set above the noise floor of a flat scanned surface rather than at zero, so that the gentle
 * undulation of attached gingiva does not become a barrier and hold the front away from the
 * real margin. Around a fifth of the strength of the margin groove itself.
 */
const CREASE_FLOOR = 0.015;

/**
 * How much a crease multiplies the cost of crossing it.
 *
 * The fronts meet inside the most expensive thing between their seeds, so this only has to make
 * the margin decisively dearer than the surface either side of it: at full crease strength an
 * edge costs about twelve times a flat one. Higher does not move the boundary, it only makes
 * the arithmetic stiffer; much lower and the boundary drifts off the groove toward the midpoint
 * between the seeds, which is the height-model failure over again.
 */
const CREASE_WEIGHT = 150;

/**
 * How far apical of its own sector's occlusal-most point enamel can possibly reach, in mm.
 *
 * Everything past this seeds gum. It is the counterweight the race needs: the crown seeds sit a
 * couple of millimetres from the margin, so unless the gum seeds sit a comparable distance the
 * other side of it, the crown front wins the whole arch on distance alone however dearly the
 * crease is priced - which is exactly what it did, 88 per cent enamel in one patch.
 *
 * A crease cannot supply that counterweight, though it was tried: measured over these scans, no
 * threshold cuts the surface into closed pieces (see `scripts/crease-wall-sweep.ts`, where one
 * piece holds 80 to 97 per cent of the vertices at every strength between 0.015 and 0.06). The
 * groove is a strong signal and a leaky wall, because the interdental papilla reaches right up to
 * where two teeth touch and there is no groove at all across the contact.
 *
 * The longest clinical crown in a mouth is an upper central incisor at 10 to 11 mm, so 13 mm is
 * past any enamel while still landing a few millimetres below the margin rather than out at the
 * trimmed base. Per sector, so the curve of Spee does not push the molars' seeds onto their own
 * crowns.
 */
const CROWN_REACH_MM = 13;

/** Cell size of the occlusal footprint grid, in mm. */
const FOOTPRINT_CELL_MM = 0.5;

/**
 * Depth below the occlusal extreme that counts as occlusal surface, in mm.
 *
 * Only used to find where the teeth are in plan view, not to classify anything. Generous enough
 * to reach the molars of a curved arch, which stand several millimetres away from the incisal
 * edges, and still clear of the palatal vault, the highest non-tooth surface there is.
 */
const OCCLUSAL_BAND_MM = 4;

/**
 * How far apical of its own sector's occlusal-most point a vertex may be and still seed crown.
 *
 * Per sector rather than globally, so the curve of Spee does not cost the molars their seeds.
 * This is a seed, not a boundary: it only has to be certainly enamel and to reach every tooth.
 */
const CROWN_SEED_MM = 2.5;

/** Band at the apical extreme - the trimmed base of the model - that seeds gum. */
const BASE_SEED_MM = 2;

/**
 * Horizontal distance from the nearest occlusal footprint beyond which a surface seeds gum.
 *
 * A crown is never far in plan view from the tooth's own occlusal table; the palatal vault, the
 * lingual floor and the flare of the trimmed base all are. This is what tells the palate from
 * the teeth, which no height can, and it is why the vault comes out pink.
 */
const AWAY_FROM_TEETH_MM = 4;

/**
 * Smallest patch that may stand as a tooth, in vertices.
 *
 * At the 0.2 mm triangulation of these scans a whole crown is a few thousand vertices, so this
 * is an order of magnitude below a real tooth and removes only speckle - a few triangles left
 * behind on the gum where a crease happened to close on itself.
 */
const MIN_CROWN_VERTICES = 300;

/** Smallest hole in a crown that may stand as gum, in vertices. The same reasoning inverted. */
const MIN_GUM_VERTICES = 300;

/**
 * Passes of one-ring majority taken over the finished labels, to straighten the boundary.
 *
 * The race decides each vertex on its own, so nothing in it prefers a short boundary to a long
 * one and the edge comes out fringed - a fifth-millimetre sawtooth of enamel spikes into the gum,
 * which reads as a ragged margin however well-placed it is. A majority vote over the one ring is
 * the cheap form of the same penalty: a spike one or two vertices wide is outvoted and retracts,
 * while a boundary with gum on one side and enamel on the other along its whole length has
 * nothing to outvote it and does not move. Seeds are held fixed, so this can only tidy the
 * boundary, never walk it up a tooth.
 *
 * Three passes reach about half a millimetre, the width of the fringe; more would start rounding
 * the corners of the real scallop at the papillae.
 */
const BOUNDARY_PASSES = 3;

/**
 * Iterations of pulling the boundary down into the groove it belongs in.
 *
 * A cost only has to be paid once, so the race is free to settle the boundary anywhere on the
 * shoulder above the groove where the surface is cheap - and the shoulder is where scanned
 * gingiva is noisiest, so the edge comes out furred even though the groove itself is a clean
 * scalloped line. Walking every enamel vertex that both touches gum and lies in a crease over to
 * gum lands the boundary on the floor of the groove, which is both the smoother line and the
 * clinically right one: the margin is the bottom of the sulcus, not the top of it.
 *
 * Only creased vertices move, so where there is no groove - across an interdental contact - the
 * boundary stays where the race left it. Four iterations at a fifth of a millimetre an iteration
 * spans a groove about a millimetre wide, which is what these scans record.
 */
const CREASE_SNAP_PASSES = 4;

export interface ToothGumSplit {
  /** Crown triangles, which the geometry has been reordered to put first. */
  toothTriangles: number;
  gumTriangles: number;
  /** Mean depth of the margin below the occlusal plane - the clinical crown height, in mm. */
  meanMarginMm: number;
  minMarginMm: number;
  maxMarginMm: number;
  /**
   * Share of the boundary that came to rest in a concave crease rather than on flat surface.
   *
   * The quality measure that matters, and the one the old height model could not have offered:
   * a margin is a groove, so a boundary that is not in one is not on the margin. All of it never
   * can be - there is no groove across an interproximal contact, and the palatal margin of an
   * upper is a shallower one - so these stage models run at 42-51% on the upper arch and 65-67%
   * on the lower. A collapse to the teens is what a front that has leaked into the gum looks
   * like, which is the state this figure exists to make visible.
   */
  detectedFraction: number;
  /**
   * Separate crown patches.
   *
   * Not one per tooth: these scans record the interproximal contacts closed, so teeth in contact
   * share a surface and a whole arch welds into one or two patches. A high count is the
   * interesting one - it means enamel is being cut out of the gum in specks.
   */
  crownRegions: number;
  /**
   * How far the margin rises and falls across one tooth's width, in mm.
   *
   * A real gingival margin scallops from the papilla between two teeth to the deepest point of a
   * tooth's own margin - 1.2 to 2.0 mm as measured here, against a textbook 2 to 4 mm, because
   * crowding hides part of the papilla and because this is read off the buccal boundary only. A
   * boundary that is flat is wrong however well placed its average height is, which is the whole
   * reason this is recorded.
   */
  scallopMm: number;
}

/** Which way is apical for an arch, and where its occlusal plane sits. */
function archAxis(geometry: THREE.BufferGeometry, arch: 'upper' | 'lower') {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  // Upper arches are normalised crowns-down, lower arches crowns-up.
  const sign = arch === 'upper' ? 1 : -1;
  return {
    box,
    sign,
    occlusalY: arch === 'upper' ? box.min.y : box.max.y,
    heightMm: box.max.y - box.min.y,
  };
}

interface Footprint {
  columns: number;
  rows: number;
  minX: number;
  minZ: number;
  /** Distance in mm from each cell to the nearest occlusal cell. */
  distanceMm: Float32Array;
  centerX: number;
  centerZ: number;
  occupied: number;
}

/**
 * Where the teeth are in plan view, and how far every other place is from them.
 *
 * The occlusal band is dropped into a grid, and the distance from each cell to the nearest
 * occupied one is grown outward from those cells in place. A grid rather than a search over
 * vertices because the answer wanted is about the region, not about the samples in it: a cell
 * eight millimetres inside the arch is palate whether or not a vertex happens to sit there.
 */
function occlusalFootprint(mesh: WeldedMesh, occlusalY: number, sign: number): Footprint {
  const { vertexCount, positions } = mesh;

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let v = 0; v < vertexCount; v++) {
    minX = Math.min(minX, positions[v * 3]);
    maxX = Math.max(maxX, positions[v * 3]);
    minZ = Math.min(minZ, positions[v * 3 + 2]);
    maxZ = Math.max(maxZ, positions[v * 3 + 2]);
  }
  // A margin of cells all round, so the distance sweep does not run off the edge of the grid.
  const pad = FOOTPRINT_CELL_MM * 4;
  minX -= pad; minZ -= pad;
  const columns = Math.ceil((maxX + pad - minX) / FOOTPRINT_CELL_MM) + 1;
  const rows = Math.ceil((maxZ + pad - minZ) / FOOTPRINT_CELL_MM) + 1;

  const occlusal = new Uint8Array(columns * rows);
  let occupied = 0;
  let sumX = 0, sumZ = 0;
  for (let v = 0; v < vertexCount; v++) {
    if ((positions[v * 3 + 1] - occlusalY) * sign > OCCLUSAL_BAND_MM) continue;
    const cx = Math.round((positions[v * 3] - minX) / FOOTPRINT_CELL_MM);
    const cz = Math.round((positions[v * 3 + 2] - minZ) / FOOTPRINT_CELL_MM);
    const cell = cz * columns + cx;
    if (occlusal[cell]) continue;
    occlusal[cell] = 1;
    occupied++;
    sumX += minX + cx * FOOTPRINT_CELL_MM;
    sumZ += minZ + cz * FOOTPRINT_CELL_MM;
  }

  // Breadth-first over the grid, four-connected. The step is one cell, so the distance is a
  // city-block one; over the four cells that matter here it differs from the straight-line
  // distance by less than the cell itself.
  const distanceMm = new Float32Array(columns * rows).fill(Infinity);
  let frontier: number[] = [];
  for (let cell = 0; cell < occlusal.length; cell++) {
    if (occlusal[cell]) {
      distanceMm[cell] = 0;
      frontier.push(cell);
    }
  }
  let ring = 0;
  while (frontier.length > 0) {
    ring += 1;
    const next: number[] = [];
    for (const cell of frontier) {
      const cx = cell % columns;
      const cz = (cell - cx) / columns;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = cx + dx;
        const nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= columns || nz >= rows) continue;
        const neighbour = nz * columns + nx;
        if (distanceMm[neighbour] !== Infinity) continue;
        distanceMm[neighbour] = ring * FOOTPRINT_CELL_MM;
        next.push(neighbour);
      }
    }
    frontier = next;
  }

  return {
    columns,
    rows,
    minX,
    minZ,
    distanceMm,
    centerX: occupied > 0 ? sumX / occupied : 0,
    centerZ: occupied > 0 ? sumZ / occupied : 0,
    occupied,
  };
}

/** Crown = 1, gum = 2, undecided = 0. */
type SeedMap = Uint8Array;
const CROWN = 1;
const GUM = 2;

/**
 * Marks the vertices whose side is not in doubt, and leaves the margin itself undecided.
 *
 * Deliberately timid. A seed in the wrong place is not corrected by anything downstream - the
 * fronts start from it - whereas a region left unseeded is decided by the crease, which is the
 * evidence this whole approach trusts. So the dead zone between the two seed sets is wide, and
 * it is where the answer actually comes from.
 */
function plantSeeds(
  mesh: WeldedMesh,
  footprint: Footprint,
  occlusalY: number,
  sign: number,
  heightMm: number,
): SeedMap {
  const { vertexCount, positions } = mesh;
  const seeds: SeedMap = new Uint8Array(vertexCount);

  // The occlusal-most depth per sector about the footprint's centre, so a crown seed can be
  // taken relative to the tooth that is actually there rather than to the whole arch.
  const sectorFloor = new Float32Array(REPORT_BINS).fill(Infinity);
  const sector = new Uint8Array(vertexCount);
  const depth = new Float32Array(vertexCount);
  for (let v = 0; v < vertexCount; v++) {
    const x = positions[v * 3];
    const z = positions[v * 3 + 2];
    depth[v] = (positions[v * 3 + 1] - occlusalY) * sign;
    const bin = Math.min(REPORT_BINS - 1, Math.max(0, Math.floor(
      ((Math.atan2(z - footprint.centerZ, x - footprint.centerX) + Math.PI) /
        (Math.PI * 2)) * REPORT_BINS)));
    sector[v] = bin;

    // Only surfaces over a tooth may set a sector's occlusal floor. Without this the palate,
    // which is nearly as occlusal as the crowns, would set it in the anterior sectors and drag
    // the crown seeds onto the vault - the original bug, in seed form.
    const cx = Math.round((x - footprint.minX) / FOOTPRINT_CELL_MM);
    const cz = Math.round((z - footprint.minZ) / FOOTPRINT_CELL_MM);
    if (footprint.distanceMm[cz * footprint.columns + cx] === 0 && depth[v] < sectorFloor[bin]) {
      sectorFloor[bin] = depth[v];
    }
  }

  for (let v = 0; v < vertexCount; v++) {
    const x = positions[v * 3];
    const z = positions[v * 3 + 2];
    const cx = Math.round((x - footprint.minX) / FOOTPRINT_CELL_MM);
    const cz = Math.round((z - footprint.minZ) / FOOTPRINT_CELL_MM);
    const away = footprint.distanceMm[cz * footprint.columns + cx];

    const floor = sectorFloor[sector[v]];
    const beyondEnamel = Number.isFinite(floor)
      ? depth[v] > floor + CROWN_REACH_MM
      : depth[v] > CROWN_REACH_MM;

    if (away > AWAY_FROM_TEETH_MM || depth[v] > heightMm - BASE_SEED_MM || beyondEnamel) {
      seeds[v] = GUM;
      continue;
    }

    if (away === 0 && Number.isFinite(floor) && depth[v] <= floor + CROWN_SEED_MM) {
      seeds[v] = CROWN;
    }
  }
  return seeds;
}

/**
 * A binary heap over vertex ids, keyed by distance.
 *
 * Written out rather than taken from a library because it is the inner loop of the whole
 * segmentation, and a sorted array here would turn a fifth of a second into minutes.
 */
class DistanceHeap {
  private items: Uint32Array;
  private keys: Float64Array;
  private size = 0;

  constructor(capacity: number) {
    this.items = new Uint32Array(capacity);
    this.keys = new Float64Array(capacity);
  }

  get length(): number {
    return this.size;
  }

  push(item: number, key: number): void {
    if (this.size === this.items.length) {
      const items = new Uint32Array(this.size * 2);
      const keys = new Float64Array(this.size * 2);
      items.set(this.items);
      keys.set(this.keys);
      this.items = items;
      this.keys = keys;
    }
    let child = this.size++;
    this.items[child] = item;
    this.keys[child] = key;
    while (child > 0) {
      const parent = (child - 1) >> 1;
      if (this.keys[parent] <= this.keys[child]) break;
      this.swap(parent, child);
      child = parent;
    }
  }

  pop(): number {
    const top = this.items[0];
    this.size--;
    if (this.size > 0) {
      this.items[0] = this.items[this.size];
      this.keys[0] = this.keys[this.size];
      let parent = 0;
      for (;;) {
        const left = parent * 2 + 1;
        if (left >= this.size) break;
        const right = left + 1;
        const child = right < this.size && this.keys[right] < this.keys[left] ? right : left;
        if (this.keys[parent] <= this.keys[child]) break;
        this.swap(parent, child);
        parent = child;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    const item = this.items[a];
    this.items[a] = this.items[b];
    this.items[b] = item;
    const key = this.keys[a];
    this.keys[a] = this.keys[b];
    this.keys[b] = key;
  }
}

/**
 * Grows both seeded regions across the surface and returns where they met.
 *
 * One Dijkstra sweep from every seed at once, each vertex inheriting the label of whichever
 * front reached it first, over a metric that charges extra for crossing a crease. The boundary
 * ends up inside the crease rather than beside it: a barrier is dear to both fronts, so the
 * place where their costs are equal lies within it. That is the whole mechanism, and it is why
 * the result follows the scallop of a real margin without being told that margins scallop.
 */
function growFronts(
  mesh: WeldedMesh,
  seeds: SeedMap,
  concavity: Float32Array,
): Uint8Array {
  const { vertexCount, positions, neighborStart, neighbors } = mesh;
  const label = new Uint8Array(vertexCount);
  const distance = new Float64Array(vertexCount).fill(Infinity);
  const settled = new Uint8Array(vertexCount);
  const heap = new DistanceHeap(Math.max(1024, vertexCount >> 2));

  for (let v = 0; v < vertexCount; v++) {
    if (seeds[v] === 0) continue;
    label[v] = seeds[v];
    distance[v] = 0;
    heap.push(v, 0);
  }

  while (heap.length > 0) {
    const v = heap.pop();
    if (settled[v]) continue;
    settled[v] = 1;
    const i = v * 3;

    for (let e = neighborStart[v]; e < neighborStart[v + 1]; e++) {
      const u = neighbors[e];
      if (settled[u]) continue;
      const j = u * 3;
      const length = Math.hypot(
        positions[j] - positions[i],
        positions[j + 1] - positions[i + 1],
        positions[j + 2] - positions[i + 2],
      );
      const crease = Math.max(0, (concavity[v] + concavity[u]) / 2 - CREASE_FLOOR);
      const step = distance[v] + length * (1 + CREASE_WEIGHT * crease);
      if (step >= distance[u]) continue;
      distance[u] = step;
      label[u] = label[v];
      heap.push(u, step);
    }
  }

  // A vertex no front reached is enclosed by seeds of neither side, which on a closed scan
  // means an isolated shell. Gum is the safer reading: it keeps stray geometry out of the
  // enamel the bite is registered against.
  for (let v = 0; v < vertexCount; v++) if (label[v] === 0) label[v] = GUM;
  return label;
}

/**
 * Straightens the fringe off the boundary by majority vote over the one ring.
 *
 * Held-fixed seeds are what keep this honest: it can shave a spike but it cannot advance the
 * boundary, because behind every stretch of it stands surface that was certain from the start.
 */
function smoothBoundary(
  mesh: WeldedMesh,
  label: Uint8Array,
  seeds: SeedMap,
  concavity: Float32Array,
): void {
  const { vertexCount, neighborStart, neighbors } = mesh;

  for (let pass = 0; pass < CREASE_SNAP_PASSES; pass++) {
    const moved: number[] = [];
    for (let v = 0; v < vertexCount; v++) {
      if (label[v] !== CROWN || seeds[v] === CROWN || concavity[v] <= CREASE_FLOOR) continue;
      for (let e = neighborStart[v]; e < neighborStart[v + 1]; e++) {
        if (label[neighbors[e]] === GUM) { moved.push(v); break; }
      }
    }
    if (moved.length === 0) break;
    // Applied after the sweep, so one iteration advances the boundary by one ring rather than
    // running away across the whole crease in the vertex order the sweep happens to visit.
    for (const v of moved) label[v] = GUM;
  }

  // Both buffers are ours, so they can be swapped between passes and the result copied back.
  let current = new Uint8Array(label);
  let next = new Uint8Array(vertexCount);

  for (let pass = 0; pass < BOUNDARY_PASSES; pass++) {
    for (let v = 0; v < vertexCount; v++) {
      if (seeds[v] !== 0) {
        next[v] = seeds[v];
        continue;
      }
      // The closed one ring: the vertex itself votes, so a vertex whose neighbours are evenly
      // split keeps what it had.
      let crown = current[v] === CROWN ? 1 : 0;
      let total = 1;
      for (let e = neighborStart[v]; e < neighborStart[v + 1]; e++) {
        if (current[neighbors[e]] === CROWN) crown++;
        total++;
      }
      next[v] = crown * 2 > total ? CROWN : GUM;
    }
    const swap = current;
    current = next;
    next = swap;
  }

  label.set(current);
}

/**
 * Removes patches too small to be what they claim.
 *
 * The fronts meet along creases, and a crease that happens to close on itself away from a tooth
 * leaves a scrap of the wrong label behind - a speck of enamel on the gum, or a hole in a crown
 * where an attachment is bonded to it. Both are decided by size, because the thing that makes
 * them wrong is that a tooth is not two triangles and neither is a gap between teeth.
 */
function removeSpecks(mesh: WeldedMesh, label: Uint8Array): number {
  const crownMask = new Uint8Array(mesh.vertexCount);
  for (let v = 0; v < mesh.vertexCount; v++) crownMask[v] = label[v] === CROWN ? 1 : 0;
  const crowns = connectedRegions(mesh, crownMask);
  for (let v = 0; v < mesh.vertexCount; v++) {
    const region = crowns.label[v];
    if (region >= 0 && crowns.sizes[region] < MIN_CROWN_VERTICES) label[v] = GUM;
  }

  const gumMask = new Uint8Array(mesh.vertexCount);
  for (let v = 0; v < mesh.vertexCount; v++) gumMask[v] = label[v] === GUM ? 1 : 0;
  const gums = connectedRegions(mesh, gumMask);
  // The largest gum region is the gingiva itself and is never a hole, whatever its size.
  let largest = -1;
  for (let region = 0; region < gums.sizes.length; region++) {
    if (largest < 0 || gums.sizes[region] > gums.sizes[largest]) largest = region;
  }
  for (let v = 0; v < mesh.vertexCount; v++) {
    const region = gums.label[v];
    if (region >= 0 && region !== largest && gums.sizes[region] < MIN_GUM_VERTICES) {
      label[v] = CROWN;
    }
  }

  let kept = 0;
  for (const size of crowns.sizes) if (size >= MIN_CROWN_VERTICES) kept++;
  return kept;
}

/** Everything the segmentation worked out, for the diagnostic renderer to draw. */
export interface VertexClassification {
  mesh: WeldedMesh;
  concavity: Float32Array;
  seeds: SeedMap;
  /** `CROWN` or `GUM` per vertex. */
  label: Uint8Array;
  crownRegions: number;
  occlusalY: number;
  sign: number;
  centerX: number;
  centerZ: number;
}

/**
 * Classifies every vertex of an arch as crown or gingiva.
 *
 * Exported in its own right so the diagnostic renderer can draw the concavity, the seeds and
 * the result of one run; the classification is the part worth looking at, and a picture of it
 * is the only check that catches a boundary in the wrong place. `segmentToothAndGum` is this
 * plus the bookkeeping the render path needs.
 */
export function classifyVertices(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
): VertexClassification | null {
  const { sign, occlusalY, heightMm } = archAxis(geometry, arch);
  const mesh = weldGeometry(geometry);
  if (mesh.vertexCount === 0 || mesh.triangleCount === 0) return null;

  const concavity = smoothField(mesh, concavityField(mesh), CONCAVITY_PASSES);
  const footprint = occlusalFootprint(mesh, occlusalY, sign);
  if (footprint.occupied === 0) return null;

  const seeds = plantSeeds(mesh, footprint, occlusalY, sign, heightMm);
  let crowns = 0;
  let gums = 0;
  for (let v = 0; v < mesh.vertexCount; v++) {
    if (seeds[v] === CROWN) crowns++;
    else if (seeds[v] === GUM) gums++;
  }
  // Nothing to grow from. A scan trimmed to the crowns alone, or to the gum alone, is a case
  // where refusing to answer is right: the caller draws one material and nothing is invented.
  if (crowns === 0 || gums === 0) return null;

  const label = growFronts(mesh, seeds, concavity);
  smoothBoundary(mesh, label, seeds, concavity);
  const crownRegions = removeSpecks(mesh, label);

  return {
    mesh,
    concavity,
    seeds,
    label,
    crownRegions,
    occlusalY,
    sign,
    centerX: footprint.centerX,
    centerZ: footprint.centerZ,
  };
}

/** Where the margin ended up, and how well it matches what a margin looks like. */
function marginStatistics(classification: VertexClassification): {
  meanMarginMm: number;
  minMarginMm: number;
  maxMarginMm: number;
  detectedFraction: number;
  scallopMm: number;
} {
  const { mesh, concavity, label, occlusalY, sign, centerX, centerZ } = classification;
  const { vertexCount, positions, neighborStart, neighbors } = mesh;

  // Only the buccal margin is measured. The two sides of one tooth sit millimetres apart - the
  // palatal margin of an upper molar is far more apical than its cheek-side margin - so pooling
  // them by sector averages away the very scallop the check is looking for. The cheek side is
  // also the side a clinician reads a crown height off, and the side the preview shows.
  const depths: number[][] = Array.from({ length: REPORT_BINS }, () => []);
  let boundary = 0;
  let onCrease = 0;

  for (let v = 0; v < vertexCount; v++) {
    if (label[v] !== CROWN) continue;
    let creased = concavity[v] > CREASE_FLOOR;
    let touchesGum = false;
    for (let e = neighborStart[v]; e < neighborStart[v + 1]; e++) {
      const u = neighbors[e];
      if (label[u] !== GUM) continue;
      touchesGum = true;
      // The crease is a groove a millimetre or so wide and the boundary runs along its floor, so
      // whether it is in the groove is a question about the edge, not about one of its ends: the
      // snap that puts the boundary there leaves the enamel-side vertex on the shoulder above it.
      if (concavity[u] > CREASE_FLOOR) creased = true;
    }
    if (!touchesGum) continue;

    boundary++;
    if (creased) onCrease++;

    const dx = positions[v * 3] - centerX;
    const dz = positions[v * 3 + 2] - centerZ;
    const radial = Math.hypot(dx, dz);
    if (radial === 0) continue;
    const outward =
      (mesh.normals[v * 3] * dx + mesh.normals[v * 3 + 2] * dz) / radial;
    if (outward <= 0) continue;

    const bin = Math.min(REPORT_BINS - 1, Math.max(0, Math.floor(
      ((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * REPORT_BINS)));
    depths[bin].push((positions[v * 3 + 1] - occlusalY) * sign);
  }

  // A sector's margin depth is the median of its boundary vertices: the mean would be pulled by
  // the papillae, which are part of the boundary but are not where the margin of a tooth sits.
  for (const list of depths) list.sort((a, b) => a - b);
  const perBin = depths.map(list =>
    list.length === 0 ? NaN : list[list.length >> 1]);

  // The scallop is measured off the most occlusal tenth of each sector's boundary instead, which
  // is the papilla where there is one. A median cannot see the scallop at all: a sector over a
  // papilla holds both the tip of it and the deep interproximal margin either side, so its middle
  // value lands halfway down and every sector reads much the same.
  const perBinTip = depths.map(list =>
    list.length === 0 ? NaN : list[Math.floor(list.length * 0.1)]);
  const populated = perBin.filter(value => !Number.isNaN(value));

  // Scallop, measured within a window about one tooth wide so that an arch whose margin is
  // uniformly deeper at the back does not read as scalloped for that reason alone.
  const window = Math.max(2, Math.round(REPORT_BINS / 12));
  let scallopSum = 0;
  let scallopCount = 0;
  for (let bin = 0; bin < REPORT_BINS; bin++) {
    let low = Infinity;
    let high = -Infinity;
    let complete = true;
    for (let k = 0; k < window; k++) {
      const value = perBinTip[(bin + k) % REPORT_BINS];
      if (Number.isNaN(value)) { complete = false; break; }
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    if (!complete) continue;
    scallopSum += high - low;
    scallopCount++;
  }

  return {
    meanMarginMm: populated.reduce((sum, value) => sum + value, 0) / (populated.length || 1),
    minMarginMm: populated.length ? Math.min(...populated) : NaN,
    maxMarginMm: populated.length ? Math.max(...populated) : NaN,
    detectedFraction: boundary > 0 ? onCrease / boundary : 0,
    scallopMm: scallopCount > 0 ? scallopSum / scallopCount : NaN,
  };
}

/**
 * Reorders the triangles so every crown triangle comes before every gum one, and puts a
 * material group over each range.
 *
 * Two groups over one geometry rather than two geometries, so the arch stays a single draw and
 * a single hierarchy for the bite to be registered against. The permutation is done in place on
 * whichever array carries the draw order - the index when there is one, the attributes
 * themselves when there is not.
 */
function reorderTrianglesToothFirst(
  geometry: THREE.BufferGeometry,
  isTooth: Uint8Array,
  toothTriangles: number,
): void {
  const triangles = isTooth.length;
  const order = new Uint32Array(triangles);
  let tooth = 0;
  let gum = toothTriangles;
  for (let t = 0; t < triangles; t++) order[isTooth[t] ? tooth++ : gum++] = t;

  // Any hierarchy already built over this geometry describes the old triangle order.
  disposeBoundsTreeFor(geometry);

  const index = geometry.index;
  if (index) {
    const source = index.array;
    const permuted = new (source.constructor as new (length: number) => typeof source)(
      source.length);
    for (let t = 0; t < triangles; t++) {
      permuted[t * 3] = source[order[t] * 3];
      permuted[t * 3 + 1] = source[order[t] * 3 + 1];
      permuted[t * 3 + 2] = source[order[t] * 3 + 2];
    }
    (source as unknown as { set: (a: ArrayLike<number>) => void }).set(permuted);
    index.needsUpdate = true;
  } else {
    for (const attribute of Object.values(geometry.attributes)) {
      const buffer = attribute as THREE.BufferAttribute;
      const source = buffer.array as Float32Array;
      const stride = buffer.itemSize * 3;
      const permuted = new Float32Array(source.length);
      for (let t = 0; t < triangles; t++) {
        permuted.set(source.subarray(order[t] * stride, order[t] * stride + stride), t * stride);
      }
      source.set(permuted);
      buffer.needsUpdate = true;
    }
  }

  geometry.clearGroups();
  geometry.addGroup(0, toothTriangles * 3, 0);
  geometry.addGroup(toothTriangles * 3, (triangles - toothTriangles) * 3, 1);
}

/**
 * Splits an arch into crowns and gingiva, reorders it crowns-first, and groups it for two
 * materials. Returns null when the scan does not hold both, in which case the caller draws one
 * material rather than a guess.
 *
 * Must run after `applyDentalNormalization`, which establishes which way is apical, and before
 * any bounding volume hierarchy is built, since it reorders the triangles the hierarchy would
 * be describing. Cached on the geometry, because it is the most expensive step of an import and
 * the render path asks for it on every stage change.
 */
export function segmentToothAndGum(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
): ToothGumSplit | null {
  const cached = geometry.userData.toothGumSplit as ToothGumSplit | undefined;
  if (cached) return cached;

  const classification = classifyVertices(geometry, arch);
  if (!classification) return null;

  const { mesh, label, crownRegions } = classification;
  const isTooth = new Uint8Array(mesh.triangleCount);
  let toothTriangles = 0;
  for (let t = 0; t < mesh.triangleCount; t++) {
    // Two of three vertices carries the triangle, so the boundary runs between vertices rather
    // than leaving a fringe of triangles that belong to both sides.
    const crownCorners =
      (label[mesh.triangles[t * 3]] === CROWN ? 1 : 0) +
      (label[mesh.triangles[t * 3 + 1]] === CROWN ? 1 : 0) +
      (label[mesh.triangles[t * 3 + 2]] === CROWN ? 1 : 0);
    if (crownCorners >= 2) {
      isTooth[t] = 1;
      toothTriangles++;
    }
  }

  const split: ToothGumSplit = {
    toothTriangles,
    gumTriangles: mesh.triangleCount - toothTriangles,
    crownRegions,
    ...marginStatistics(classification),
  };

  reorderTrianglesToothFirst(geometry, isTooth, toothTriangles);
  geometry.userData.toothGumSplit = split;
  return split;
}
