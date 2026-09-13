/**
 * Draws the concavity of the surface, to check the gingival crease is really there.
 *
 * Everything the replacement segmentation does rests on one assumption: that where a tooth
 * meets gum the scan records a groove, and that the groove is stronger than the noise around
 * it. If it is not - if the scanner smoothed it away, or if the fissures on the occlusal
 * surface are just as strong - then no boundary can be pinned to it and the approach is wrong.
 * Cheaper to look than to find out after writing the segmentation.
 *
 *   npx tsx scripts/concavity-view.ts
 *   npx tsx scripts/concavity-view.ts --stl "<name>.stl" --passes 6
 */
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import {
  computeDentalNormalization,
  applyDentalNormalization,
} from '../src/utils/stlParser';
import { weldGeometry, concavityField, smoothField } from '../src/utils/meshGraph';
import { renderToFile, type ViewName } from './lib/archRender';

const STL_DIR = path.join(process.cwd(), 'STL');
const OUT_DIR = path.join(process.cwd(), '.diagnostics', 'concavity');

const numberArg = (flag: string, fallback: number) => {
  const at = process.argv.indexOf(flag);
  return at > -1 ? Number(process.argv[at + 1]) : fallback;
};

/** Concave toward cyan, convex toward amber, flat grey. */
function ramp(value: number, scale: number): [number, number, number] {
  const t = Math.max(-1, Math.min(1, value / scale));
  if (t >= 0) return [Math.round(110 * (1 - t)), Math.round(110 + 145 * t), Math.round(110 + 145 * t)];
  return [Math.round(110 + 145 * -t), Math.round(110 * (1 + t * 0.4)), Math.round(110 * (1 + t))];
}

function view(file: string, passes: number) {
  const arch: 'upper' | 'lower' = /lower/i.test(file) ? 'lower' : 'upper';
  const bytes = fs.readFileSync(path.join(STL_DIR, file));
  const geometry = new STLLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  applyDentalNormalization(geometry, computeDentalNormalization(geometry, arch));

  const started = Date.now();
  const mesh = weldGeometry(geometry);
  const welded = Date.now();
  const raw = concavityField(mesh);
  const field = smoothField(mesh, raw, passes);
  const done = Date.now();

  const sorted = Float64Array.from(field).sort();
  const p = (q: number) => sorted[Math.floor(q * (sorted.length - 1))];
  console.log(`\n=== ${file} (${arch}) ===`);
  console.log(`  weld ${welded - started}ms, concavity + ${passes} smoothing passes ` +
    `${done - welded}ms, ${mesh.vertexCount} vertices, ` +
    `${(mesh.neighbors.length / mesh.vertexCount).toFixed(2)} neighbours each`);
  console.log(`  concavity p01 ${p(0.01).toFixed(4)}  p10 ${p(0.10).toFixed(4)}  ` +
    `median ${p(0.5).toFixed(4)}  p90 ${p(0.90).toFixed(4)}  p99 ${p(0.99).toFixed(4)}`);

  // The picture is scaled to the 99th percentile, so the strongest few per cent of creases
  // saturate and everything else is readable against them.
  const scale = Math.max(1e-4, p(0.99));
  const perTriangle = new Float32Array(mesh.triangleCount);
  for (let t = 0; t < mesh.triangleCount; t++) {
    perTriangle[t] = (field[mesh.triangles[t * 3]] + field[mesh.triangles[t * 3 + 1]] +
      field[mesh.triangles[t * 3 + 2]]) / 3;
  }

  const views: ViewName[] = arch === 'upper'
    ? ['front', 'below', 'obliqueBelow']
    : ['front', 'above', 'oblique'];
  const stem = file.replace(/\.stl$/i, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  for (const name of views) {
    renderToFile(path.join(OUT_DIR, `${stem}-${name}.png`),
      [{ geometry, crownTriangles: 0, colorOf: t => ramp(perTriangle[t], scale) }],
      { view: name, flat: true });
  }
  console.log(`  wrote ${views.length} views to ${path.relative(process.cwd(), OUT_DIR)} ` +
    `(cyan = concave at ${scale.toFixed(4)} full scale, amber = convex)`);
}

const at = process.argv.indexOf('--stl');
const files = at > -1
  ? [process.argv[at + 1]]
  : fs.readdirSync(STL_DIR).filter(name => /- 01 - Model\.stl$/i.test(name)).sort();
for (const file of files) view(file, numberArg('--passes', 4));
