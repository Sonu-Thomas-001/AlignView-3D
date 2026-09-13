/**
 * How well a crease of a given strength walls the crowns off from the gum.
 *
 * MEASURED RESULT: they never close. At every strength from 0.015 to 0.06 a single piece holds 80
 * to 97 per cent of the vertices and holds seeds of both kinds, on both arches - so cutting along
 * the creases yields no verdict about anything, and the segmentation cannot lean on it. Kept as
 * the evidence for why the crown/gum split prices the crease instead of trusting it as a wall.
 *
 * The idea was that the creases are closed loops: cut the surface along everything more
 * concave than the wall threshold and each crown should fall off as its own piece, holding
 * occlusal seeds and no gum seed. Whether that happens is a property of the scans, not of an
 * opinion, so it is measured - too weak a wall and one piece holds everything, too strong and the
 * loops open up and the crowns rejoin the gum.
 */
import fs from 'fs';
import path from 'path';
import { STLLoader } from 'three-stdlib';
import { computeDentalNormalization, applyDentalNormalization } from '../src/utils/stlParser';
import { classifyVertices } from '../src/utils/toothGumSegmentation';
import { connectedRegions } from '../src/utils/meshGraph';

const STL_DIR = path.join(process.cwd(), 'STL');

function sweep(file: string) {
  const arch: 'upper' | 'lower' = /lower/i.test(file) ? 'lower' : 'upper';
  const bytes = fs.readFileSync(path.join(STL_DIR, file));
  const geometry = new STLLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  applyDentalNormalization(geometry, computeDentalNormalization(geometry, arch));
  const found = classifyVertices(geometry, arch);
  if (!found) return console.log(`${file}: no classification`);
  const { mesh, concavity, seeds } = found;

  console.log(`\n=== ${file} (${arch}) ===`);
  console.log('  wall   walled%  pieces  crown-only  gum-only  contested  unseeded  largest%');
  for (const wall of [0.015, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06]) {
    const open = new Uint8Array(mesh.vertexCount);
    let walled = 0;
    for (let v = 0; v < mesh.vertexCount; v++) {
      open[v] = concavity[v] <= wall ? 1 : 0;
      if (!open[v]) walled++;
    }
    const { label, sizes } = connectedRegions(mesh, open);
    const crown = new Uint32Array(sizes.length);
    const gum = new Uint32Array(sizes.length);
    for (let v = 0; v < mesh.vertexCount; v++) {
      const id = label[v];
      if (id < 0 || seeds[v] === 0) continue;
      if (seeds[v] === 1) crown[id]++; else gum[id]++;
    }
    let crownOnly = 0, gumOnly = 0, contested = 0, unseeded = 0;
    for (let id = 0; id < sizes.length; id++) {
      if (crown[id] && gum[id]) contested++;
      else if (crown[id]) crownOnly++;
      else if (gum[id]) gumOnly++;
      else unseeded++;
    }
    const largest = Math.max(...sizes) / mesh.vertexCount * 100;
    console.log(`  ${wall.toFixed(3)}  ${(walled / mesh.vertexCount * 100).toFixed(1).padStart(6)}` +
      `  ${String(sizes.length).padStart(6)}  ${String(crownOnly).padStart(10)}` +
      `  ${String(gumOnly).padStart(8)}  ${String(contested).padStart(9)}` +
      `  ${String(unseeded).padStart(8)}  ${largest.toFixed(1).padStart(7)}`);
  }
}

const at = process.argv.indexOf('--stl');
const files = at > -1 ? [process.argv[at + 1]]
  : fs.readdirSync(STL_DIR).filter(name => /- 01 - Model\.stl$/i.test(name)).sort();
for (const file of files) sweep(file);
