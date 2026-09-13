/**
 * Draws how the crown/gum split actually classified a real arch, and measures the boundary.
 *
 * The split was reported wrong by eye - crowns drawn far up into the gum, with a jagged
 * near-horizontal edge - while every number the pipeline records about it (crown area share,
 * mean margin depth, detected fraction) looked healthy. So this renders the classification and
 * measures the properties a wrong answer can't fake:
 *
 *   crown height       a clinical crown stands 7-11 mm, so the boundary sits that far apical of
 *                      the occlusal plane. Much more means gum has been called enamel.
 *   crown islands      one large island per group of teeth in contact. These scans close the
 *                      interproximal contacts, so a whole arch welds into one or two islands and
 *                      a *high* count is the failure signal: hundreds means the boundary is
 *                      cutting speckle out of the gum.
 *   scallop            reported by the estimator itself, off the most occlusal tenth of each
 *                      sector's buccal boundary. A margin rises 2-4 mm from a tooth's deepest
 *                      point to the papilla beside it, and a flat boundary is wrong however
 *                      well-placed its average height is. Measured here as the depth envelope
 *                      below, which by construction cannot show it - the deepest boundary point
 *                      in every sector is an interproximal one - so the two are complementary.
 *
 *   npx tsx scripts/segmentation-view.ts                    # stage 01, both arches
 *   npx tsx scripts/segmentation-view.ts --stl "<name>.stl"
 */
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { importArchStage, geometryFromImport } from '../src/utils/stlImportPipeline';
import { renderToFile, type ViewName } from './lib/archRender';

const STL_DIR = path.join(process.cwd(), 'STL');
const OUT_DIR = path.join(process.cwd(), '.diagnostics', 'segmentation');

function readStage(file: string) {
  const arch: 'upper' | 'lower' = /lower/i.test(file) ? 'lower' : 'upper';
  const bytes = fs.readFileSync(path.join(STL_DIR, file));
  const buffer = bytes.buffer.slice(
    bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const result = importArchStage(buffer, { arch, frame: null, refCenter: null, mismatchMm: 5 });
  return { arch, geometry: geometryFromImport(result), split: result.split };
}

/** Triangle centroids, so a triangle-level measurement has one position per triangle. */
function centroids(geometry: THREE.BufferGeometry): Float32Array {
  const position = geometry.attributes.position;
  const index = geometry.index;
  const triangles = Math.floor((index ? index.count : position.count) / 3);
  const out = new Float32Array(triangles * 3);
  for (let t = 0; t < triangles; t++) {
    for (let k = 0; k < 3; k++) {
      const i = index ? index.getX(t * 3 + k) : t * 3 + k;
      out[t * 3] += position.getX(i) / 3;
      out[t * 3 + 1] += position.getY(i) / 3;
      out[t * 3 + 2] += position.getZ(i) / 3;
    }
  }
  return out;
}

/**
 * The classified boundary height, per 5-degree sector around the arch.
 *
 * The apical-most crown triangle in a sector is where that sector's boundary sits. Reading it
 * this way rather than from the estimator's own margin array measures what was *drawn*, which
 * is the thing under suspicion.
 */
function boundaryProfile(
  geometry: THREE.BufferGeometry,
  crownTriangles: number,
  arch: 'upper' | 'lower',
): { bins: Float64Array; occlusalY: number } {
  const centers = centroids(geometry);
  const sign = arch === 'upper' ? 1 : -1; // apical direction
  const box = geometry.boundingBox!;
  const occlusalY = arch === 'upper' ? box.min.y : box.max.y;

  // Horseshoe centre, from the crowns' footprint.
  let sx = 0, sz = 0, n = 0;
  for (let t = 0; t < crownTriangles; t++) {
    sx += centers[t * 3];
    sz += centers[t * 3 + 2];
    n++;
  }
  const centerX = n ? sx / n : 0;
  const centerZ = n ? sz / n : 0;

  const BINS = 72;
  const bins = new Float64Array(BINS).fill(NaN);
  for (let t = 0; t < crownTriangles; t++) {
    const bin = Math.floor(
      ((Math.atan2(centers[t * 3 + 2] - centerZ, centers[t * 3] - centerX) + Math.PI)
        / (Math.PI * 2)) * BINS) % BINS;
    // Depth apical of the occlusal plane, so both arches read as positive downwards.
    const depth = (centers[t * 3 + 1] - occlusalY) * sign;
    if (Number.isNaN(bins[bin]) || depth > bins[bin]) bins[bin] = depth;
  }
  return { bins, occlusalY };
}

/**
 * Connected crown patches, over triangles that share a vertex position.
 *
 * Positions are hashed rather than compared by index because STL triangles do not share
 * vertices at all - every triangle carries its own three copies.
 */
function crownIslands(geometry: THREE.BufferGeometry, crownTriangles: number): number[] {
  const position = geometry.attributes.position;
  const index = geometry.index;

  const byVertex = new Map<string, number[]>();
  const key = (i: number) =>
    `${Math.round(position.getX(i) * 100)},${Math.round(position.getY(i) * 100)},${Math.round(position.getZ(i) * 100)}`;

  for (let t = 0; t < crownTriangles; t++) {
    for (let k = 0; k < 3; k++) {
      const i = index ? index.getX(t * 3 + k) : t * 3 + k;
      const k2 = key(i);
      const list = byVertex.get(k2);
      if (list) list.push(t);
      else byVertex.set(k2, [t]);
    }
  }

  const parent = new Int32Array(crownTriangles);
  for (let t = 0; t < crownTriangles; t++) parent[t] = t;
  const find = (a: number): number => {
    while (parent[a] !== a) a = parent[a] = parent[parent[a]];
    return a;
  };
  for (const list of byVertex.values()) {
    for (let i = 1; i < list.length; i++) {
      const ra = find(list[0]);
      const rb = find(list[i]);
      if (ra !== rb) parent[rb] = ra;
    }
  }

  const sizes = new Map<number, number>();
  for (let t = 0; t < crownTriangles; t++) {
    const root = find(t);
    sizes.set(root, (sizes.get(root) ?? 0) + 1);
  }
  return [...sizes.values()].sort((a, b) => b - a);
}

function report(file: string) {
  const { arch, geometry, split } = readStage(file);
  const position = geometry.attributes.position;
  const index = geometry.index;
  const triangles = Math.floor((index ? index.count : position.count) / 3);
  const crownTriangles = split ? split.toothTriangles : triangles;

  console.log(`\n=== ${file} (${arch}) ===`);
  console.log(`  triangles ${triangles}  crowns ${crownTriangles} ` +
    `(${((crownTriangles / triangles) * 100).toFixed(1)}%)  gum ${triangles - crownTriangles}`);
  if (split) {
    console.log(`  margin depth mean ${split.meanMarginMm.toFixed(2)}mm ` +
      `min ${split.minMarginMm.toFixed(2)} max ${split.maxMarginMm.toFixed(2)}  ` +
      `on-crease ${(split.detectedFraction * 100).toFixed(0)}%  ` +
      `regions ${split.crownRegions}  scallop ${split.scallopMm.toFixed(2)}mm`);
  }

  const { bins } = boundaryProfile(geometry, crownTriangles, arch);
  const populated = [...bins].filter(value => !Number.isNaN(value));
  const sorted = [...populated].sort((a, b) => a - b);
  const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];

  // Scallop amplitude: how much the boundary rises and falls from one sector to the next few.
  // Measured as the spread within a moving window about one tooth wide (6 bins = 30 degrees),
  // so a globally tilted-but-flat boundary does not read as scalloped.
  let scallopSum = 0;
  let scallopCount = 0;
  for (let bin = 0; bin < bins.length; bin++) {
    let low = Infinity;
    let high = -Infinity;
    let ok = true;
    for (let k = 0; k < 6; k++) {
      const value = bins[(bin + k) % bins.length];
      if (Number.isNaN(value)) { ok = false; break; }
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    if (!ok) continue;
    scallopSum += high - low;
    scallopCount++;
  }

  console.log(`  boundary depth below the occlusal plane: ` +
    `p05 ${p(0.05).toFixed(1)}mm  median ${p(0.5).toFixed(1)}mm  p95 ${p(0.95).toFixed(1)}mm`);
  console.log(`  deepest-boundary envelope over a 30deg window: ` +
    `${(scallopCount ? scallopSum / scallopCount : NaN).toFixed(2)}mm  ` +
    `[flat is expected here; the scallop is the estimator's own figure above]`);

  const islands = crownIslands(geometry, crownTriangles);
  const significant = islands.filter(size => size >= 20);
  console.log(`  crown islands: ${islands.length} total, ${significant.length} of 20+ triangles ` +
    `[expect a handful; hundreds means speckle]  largest ${islands.slice(0, 4).join(', ')}`);

  const views: ViewName[] = arch === 'upper'
    ? ['front', 'below', 'obliqueBelow']
    : ['front', 'above', 'oblique'];
  const stem = file.replace(/\.stl$/i, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  for (const view of views) {
    const { file: written, mmPerPixel } = renderToFile(
      path.join(OUT_DIR, `${stem}-${view}.png`),
      [{ geometry, crownTriangles }],
      { view, scaleBar: true },
    );
    console.log(`  wrote ${path.relative(process.cwd(), written)} ` +
      `(${mmPerPixel.toFixed(3)} mm/px)`);
  }
}

function main() {
  if (!fs.existsSync(STL_DIR)) {
    console.log(`SKIP  no STL directory at ${STL_DIR}`);
    return;
  }
  const argIndex = process.argv.indexOf('--stl');
  const files = argIndex > -1
    ? [process.argv[argIndex + 1]]
    : fs.readdirSync(STL_DIR).filter(name => /- 01 - Model\.stl$/i.test(name)).sort();

  if (files.length === 0) {
    console.log('SKIP  no matching stage files');
    return;
  }
  for (const file of files) report(file);
}

main();
