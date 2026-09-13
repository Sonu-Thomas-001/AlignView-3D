/**
 * Renders what a provider actually shares: both arches seated in occlusion, in the app's colours.
 *
 * The three things a shared preview has to get right - which surface is enamel, where the arches
 * meet, and what the two look like - are separate pieces of code, and each has its own check.
 * None of those checks can see the picture the patient is shown, which is where a fault in any
 * one of them becomes obvious: enamel running into the gum, an upper arch merged through a lower,
 * a bite that opens on one side. This draws that picture.
 *
 *   npx tsx scripts/preview-check.ts
 *   npx tsx scripts/preview-check.ts --upper 25 --lower 07
 */
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { importArchStage, geometryFromImport } from '../src/utils/stlImportPipeline';
import { computeOcclusionOffset } from '../src/utils/occlusion';
import { ensureBoundsTree } from '../src/utils/meshBvh';
import { renderToFile, type ViewName, type ArchLayer } from './lib/archRender';

const STL_DIR = path.join(process.cwd(), 'STL');
const OUT_DIR = path.join(process.cwd(), '.diagnostics', 'preview');

/** The app's own defaults, from `useViewerStore`. Changing them there should change this picture. */
const ENAMEL: [number, number, number] = [0xfa, 0xf7, 0xee];
const GINGIVA: [number, number, number] = [0xd9, 0x8e, 0x96];

function stageFile(arch: 'upper' | 'lower', stage: string) {
  const want = new RegExp(`${arch} jaw - 0*${stage} - Model\.stl$`, 'i');
  const file = fs.readdirSync(STL_DIR).find(name => want.test(name));
  if (!file) throw new Error(`no ${arch} stage ${stage} in ${STL_DIR}`);
  return file;
}

function load(arch: 'upper' | 'lower', stage: string) {
  const file = stageFile(arch, stage);
  const bytes = fs.readFileSync(path.join(STL_DIR, file));
  const result = importArchStage(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    { arch, frame: null, refCenter: null, mismatchMm: 5 });
  return { file, geometry: geometryFromImport(result), split: result.split };
}

/**
 * How far every lower crown point stands from the upper arch above it, by sextant.
 *
 * A seat can report contact and a penetration of nothing at all while resting on a single high
 * cusp and hanging open everywhere else, which is what a lateral view shows and no single number
 * does. Clearance is measured straight up from each lower crown point, because that is the
 * direction the arches were seated along.
 */
function reportClearance(
  upperGeom: THREE.BufferGeometry,
  lowerGeom: THREE.BufferGeometry,
  lowerCrownTriangles: number,
  seated: THREE.Matrix4,
) {
  const bvh = ensureBoundsTree(upperGeom);
  const position = lowerGeom.attributes.position;
  const index = lowerGeom.index;
  const ray = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
  const point = new THREE.Vector3();

  // Anterior is the front third of the arch in Z, and the two posterior sextants are left and
  // right of the midline behind it - the divisions a clinician reads a bite in.
  const named = ['right posterior', 'anterior', 'left posterior'];
  const gaps: number[][] = [[], [], []];
  const stride = Math.max(1, Math.floor(lowerCrownTriangles / 6000));

  for (let t = 0; t < lowerCrownTriangles; t += stride) {
    const i = index ? index.getX(t * 3) : t * 3;
    point.set(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(seated);
    ray.origin.copy(point);
    const hits = bvh.raycast(ray, THREE.FrontSide);
    if (hits.length === 0) continue;
    let nearest = Infinity;
    for (const hit of hits) nearest = Math.min(nearest, hit.distance);
    const sextant = point.z > 6 ? 1 : point.x < 0 ? 0 : 2;
    gaps[sextant].push(nearest);
  }

  console.log('  clearance from the lower crowns up to the upper arch:');
  for (let sextant = 0; sextant < 3; sextant++) {
    const list = gaps[sextant].sort((a, b) => a - b);
    if (list.length === 0) {
      console.log(`    ${named[sextant].padEnd(15)} nothing above it`);
      continue;
    }
    const q = (f: number) => list[Math.min(list.length - 1, Math.floor(f * list.length))];
    console.log(`    ${named[sextant].padEnd(15)} closest ${list[0].toFixed(2)}mm  ` +
      `p05 ${q(0.05).toFixed(2)}  median ${q(0.5).toFixed(2)}  ` +
      `(${list.length} points)`);
  }
}

function main() {
  const arg = (flag: string, fallback: string) => {
    const at = process.argv.indexOf(flag);
    return at > -1 ? process.argv[at + 1] : fallback;
  };
  const upper = load('upper', arg('--upper', '1'));
  const lower = load('lower', arg('--lower', '1'));

  // Seated the same way the viewport seats them, so the picture is the app's bite and not one
  // this script arranged for itself.
  const offset = computeOcclusionOffset(upper.geometry, lower.geometry);
  const seated = new THREE.Matrix4()
    .makeTranslation(offset.dx, offset.dy, offset.dz)
    .multiply(new THREE.Matrix4().makeRotationZ(offset.rollRad))
    .multiply(new THREE.Matrix4().makeRotationX(offset.pitchRad));

  console.log(`upper ${upper.file}\nlower ${lower.file}`);
  console.log(`  seat dy=${offset.dy.toFixed(2)}mm dz=${offset.dz.toFixed(2)}mm ` +
    `pitch=${(offset.pitchRad * 180 / Math.PI).toFixed(2)}deg ` +
    `contacts=${offset.contactCells} penetration=${offset.penetrationMm.toFixed(3)}mm`);
  for (const [name, arch] of [['upper', upper], ['lower', lower]] as const) {
    console.log(`  ${name}: enamel ${arch.split ? (arch.split.toothTriangles /
      (arch.split.toothTriangles + arch.split.gumTriangles) * 100).toFixed(1) : '?'}% of triangles, ` +
      `margin ${arch.split ? arch.split.meanMarginMm.toFixed(2) : '?'}mm, ` +
      `on-crease ${arch.split ? (arch.split.detectedFraction * 100).toFixed(0) : '?'}%`);
  }

  reportClearance(upper.geometry, lower.geometry, lower.split?.toothTriangles ?? 0, seated);

  const layers: ArchLayer[] = [
    {
      geometry: upper.geometry,
      crownTriangles: upper.split?.toothTriangles ?? 0,
      colorOf: t => (t < (upper.split?.toothTriangles ?? 0) ? ENAMEL : GINGIVA),
    },
    {
      geometry: lower.geometry,
      crownTriangles: lower.split?.toothTriangles ?? 0,
      matrix: seated,
      colorOf: t => (t < (lower.split?.toothTriangles ?? 0) ? ENAMEL : GINGIVA),
    },
  ];

  const views: ViewName[] = ['front', 'right', 'oblique'];
  for (const view of views) {
    const { file, mmPerPixel } = renderToFile(
      path.join(OUT_DIR, `bite-u${arg('--upper', '1')}-l${arg('--lower', '1')}-${view}.png`),
      layers, { view, scaleBar: true });
    console.log(`  wrote ${path.relative(process.cwd(), file)} (${mmPerPixel.toFixed(3)} mm/px)`);
  }
}

main();
