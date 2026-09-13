/**
 * Draws each stage of the crown/gum split separately: the crease, the seeds, the result.
 *
 * A single picture of the outcome says "wrong" but not "where". Three pictures of the same arch
 * say which step is at fault - a seed in the wrong place, a crease that isn't there, or a front
 * that leaked through one - and that is the difference between fixing it and guessing at it.
 *
 *   npx tsx scripts/segmentation-stages.ts
 *   npx tsx scripts/segmentation-stages.ts --stl "<name>.stl" --view front
 */
import fs from 'fs';
import path from 'path';
import { STLLoader } from 'three-stdlib';
import { computeDentalNormalization, applyDentalNormalization } from '../src/utils/stlParser';
import { classifyVertices } from '../src/utils/toothGumSegmentation';
import { renderToFile, type ViewName } from './lib/archRender';

const STL_DIR = path.join(process.cwd(), 'STL');
const OUT_DIR = path.join(process.cwd(), '.diagnostics', 'stages');

type RGB = [number, number, number];
const ENAMEL: RGB = [255, 255, 255];
const GINGIVA: RGB = [217, 142, 150];
const UNDECIDED: RGB = [70, 78, 92];
const CREASE: RGB = [40, 230, 230];
const FLAT: RGB = [110, 110, 110];
const CONVEX: RGB = [235, 120, 40];

function run(file: string, only?: ViewName) {
  const arch: 'upper' | 'lower' = /lower/i.test(file) ? 'lower' : 'upper';
  const bytes = fs.readFileSync(path.join(STL_DIR, file));
  const geometry = new STLLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  applyDentalNormalization(geometry, computeDentalNormalization(geometry, arch));

  const started = Date.now();
  const found = classifyVertices(geometry, arch);
  if (!found) {
    console.log(`\n=== ${file}: no classification ===`);
    return;
  }
  const { mesh, concavity, seeds, label, crownRegions } = found;

  let crownSeeds = 0, gumSeeds = 0, crownLabels = 0;
  for (let v = 0; v < mesh.vertexCount; v++) {
    if (seeds[v] === 1) crownSeeds++;
    else if (seeds[v] === 2) gumSeeds++;
    if (label[v] === 1) crownLabels++;
  }
  console.log(`\n=== ${file} (${arch}) ===`);
  console.log(`  ${Date.now() - started}ms  ${mesh.vertexCount} vertices`);
  console.log(`  seeds: crown ${crownSeeds} (${(crownSeeds / mesh.vertexCount * 100).toFixed(1)}%), ` +
    `gum ${gumSeeds} (${(gumSeeds / mesh.vertexCount * 100).toFixed(1)}%), ` +
    `undecided ${(100 - (crownSeeds + gumSeeds) / mesh.vertexCount * 100).toFixed(1)}%`);
  console.log(`  result: crown vertices ${(crownLabels / mesh.vertexCount * 100).toFixed(1)}%, ` +
    `${crownRegions} crown regions`);

  const perTriangle = (field: Float32Array) => {
    const out = new Float32Array(mesh.triangleCount);
    for (let t = 0; t < mesh.triangleCount; t++) {
      out[t] = (field[mesh.triangles[t * 3]] + field[mesh.triangles[t * 3 + 1]] +
        field[mesh.triangles[t * 3 + 2]]) / 3;
    }
    return out;
  };
  const majority = (values: Uint8Array, want: number) => {
    const out = new Uint8Array(mesh.triangleCount);
    for (let t = 0; t < mesh.triangleCount; t++) {
      const votes = (values[mesh.triangles[t * 3]] === want ? 1 : 0) +
        (values[mesh.triangles[t * 3 + 1]] === want ? 1 : 0) +
        (values[mesh.triangles[t * 3 + 2]] === want ? 1 : 0);
      out[t] = votes >= 2 ? 1 : 0;
    }
    return out;
  };

  const creaseTri = perTriangle(concavity);
  const crownSeedTri = majority(seeds, 1);
  const gumSeedTri = majority(seeds, 2);
  const crownTri = majority(label, 1);

  const layers: Record<string, (t: number) => RGB> = {
    // Cyan where the surface is creased, amber where it bulges. The margin should read as a
    // continuous cyan loop around every tooth.
    crease: t => {
      const value = creaseTri[t] / 0.085;
      if (value > 0) return [
        Math.round(FLAT[0] + (CREASE[0] - FLAT[0]) * Math.min(1, value)),
        Math.round(FLAT[1] + (CREASE[1] - FLAT[1]) * Math.min(1, value)),
        Math.round(FLAT[2] + (CREASE[2] - FLAT[2]) * Math.min(1, value))];
      return [
        Math.round(FLAT[0] + (CONVEX[0] - FLAT[0]) * Math.min(1, -value)),
        Math.round(FLAT[1] + (CONVEX[1] - FLAT[1]) * Math.min(1, -value)),
        Math.round(FLAT[2] + (CONVEX[2] - FLAT[2]) * Math.min(1, -value))];
    },
    // What was asserted before any growing: everything grey is left to the crease to decide.
    seeds: t => crownSeedTri[t] ? ENAMEL : gumSeedTri[t] ? GINGIVA : UNDECIDED,
    result: t => (crownTri[t] ? ENAMEL : GINGIVA),
  };

  const views: ViewName[] = only ? [only]
    : arch === 'upper' ? ['front', 'below', 'obliqueBelow'] : ['front', 'above', 'oblique'];
  const stem = file.replace(/\.stl$/i, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  for (const [name, colorOf] of Object.entries(layers)) {
    for (const view of views) {
      renderToFile(path.join(OUT_DIR, `${stem}-${name}-${view}.png`),
        [{ geometry, crownTriangles: 0, colorOf }], { view, flat: name !== 'result' });
    }
  }
  console.log(`  wrote ${Object.keys(layers).length * views.length} views to ` +
    path.relative(process.cwd(), OUT_DIR));
}

const viewAt = process.argv.indexOf('--view');
const only = viewAt > -1 ? (process.argv[viewAt + 1] as ViewName) : undefined;
const at = process.argv.indexOf('--stl');
const files = at > -1
  ? [process.argv[at + 1]]
  : fs.readdirSync(STL_DIR).filter(name => /- 01 - Model\.stl$/i.test(name)).sort();
for (const file of files) run(file, only);
