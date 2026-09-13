/**
 * One-off verification script (not part of the app) that runs the real upload
 * pipeline (parse filename -> load STL -> normalize geometry -> compute pose ->
 * compute stage movement) against the actual sample patient case in /STL,
 * to confirm the end-to-end logic works correctly with real data.
 *
 * Run with: npx tsx scripts/e2e-real-data-check.ts
 */
import fs from 'fs';
import path from 'path';
import {
  parseSTLFilename,
  detectBatchPatientName,
  sortSTLFilesByStage,
} from '../src/utils/stlParser';
import { importArchStage, geometryFromImport } from '../src/utils/stlImportPipeline';
import { computeStageMovement, computeMovementColors } from '../src/utils/movementAnalytics';
import { computeOcclusionOffset } from '../src/utils/occlusion';
import { type ToothGumSplit } from '../src/utils/toothGumSegmentation';
import { STLFileInfo } from '../src/types/dental';
import * as THREE from 'three';

const STL_DIR = path.join(__dirname, '..', 'STL');
const filenames = fs.readdirSync(STL_DIR).filter(f => f.toLowerCase().endsWith('.stl'));

console.log(`Found ${filenames.length} STL files in /STL\n`);

console.log('--- Filename parsing ---');
for (const name of filenames) {
  const meta = parseSTLFilename(name);
  console.log(`${name}  ->  arch=${meta.arch} stage=${meta.stage} template=${meta.isTemplate} patient=${meta.patientName}`);
}

const detectedPatient = detectBatchPatientName(filenames);
console.log(`\nDetected batch patient name: ${detectedPatient}`);

console.log('\n--- Loading + normalizing geometry + computing pose ---');
const upperFiles: STLFileInfo[] = [];
const lowerFiles: STLFileInfo[] = [];

// Mirrors the import pipeline: one placement transform per arch, derived from the
// earliest non-template stage, applied to every stage of that arch. Deriving it per
// stage would re-centre each stage and cancel out the tooth movement being measured.
const archFrames: Partial<Record<'upper' | 'lower', number[]>> = {};
const archRefCenters: Partial<Record<'upper' | 'lower', [number, number, number]>> = {};

/** Same threshold the upload modal uses, so this script rejects what the app rejects. */
const FRAME_MISMATCH_MM = 5;
const splits = new Map<string, ToothGumSplit>();

/** Surface area (mm2) of a contiguous run of triangles, used to check the split. */
function areaOfTriangleRange(
  geometry: THREE.BufferGeometry,
  startTriangle: number,
  triangleCount: number,
): number {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  let area = 0;
  for (let t = startTriangle; t < startTriangle + triangleCount; t++) {
    a.fromBufferAttribute(position, t * 3);
    b.fromBufferAttribute(position, t * 3 + 1);
    c.fromBufferAttribute(position, t * 3 + 2);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    area += ab.cross(ac).length() * 0.5;
  }
  return area;
}

const importOrder = [...filenames].sort((a, b) => {
  const ma = parseSTLFilename(a);
  const mb = parseSTLFilename(b);
  // References (earliest non-template stage of each arch) sort first.
  const rank = (m: ReturnType<typeof parseSTLFilename>) => (m.isTemplate ? 1 : 0);
  return rank(ma) - rank(mb) || (ma.stage ?? 0) - (mb.stage ?? 0);
});

for (const name of importOrder) {
  const meta = parseSTLFilename(name);
  const arch = meta.arch === 'lower' ? 'lower' : 'upper';
  const buffer = fs.readFileSync(path.join(STL_DIR, name));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  // The exact function the app's import worker runs, including the crown/gingiva split
  // and the mismatched-frame fallback. Calling it here rather than re-deriving the steps
  // means this script cannot pass on logic a provider never actually gets.
  const result = importArchStage(arrayBuffer, {
    arch,
    frame: archFrames[arch] ?? null,
    refCenter: archRefCenters[arch] ?? null,
    mismatchMm: FRAME_MISMATCH_MM,
  });

  if (!archFrames[arch]) {
    archFrames[arch] = result.frame;
    archRefCenters[arch] = result.center;
  }

  const geometry = geometryFromImport(result);
  const frameShift = result.frameShiftMm;
  const split = result.split;
  if (split) splits.set(name, split);

  const [width, height, depth] = result.size;

  const info: STLFileInfo = {
    id: `stl_${name}`,
    name,
    arch,
    stage: meta.stage ?? 1,
    date: '',
    fileSize: '',
    verticesCount: result.verticesCount,
    trianglesCount: result.trianglesCount,
    dimensions: { width, depth, height },
    isTemplate: meta.isTemplate,
    centroid: { x: result.centroid[0], y: result.centroid[1], z: result.centroid[2] },
    principalAxis: {
      x: result.principalAxis[0],
      y: result.principalAxis[1],
      z: result.principalAxis[2],
    },
    usesSharedFrame: result.usesSharedFrame,
    frameShiftMm: parseFloat(result.frameShiftMm.toFixed(3)),
    toothTriangles: split?.toothTriangles,
    gumTriangles: split?.gumTriangles,
    customBufferGeometry: geometry,
  };

  if (arch === 'upper') upperFiles.push(info);
  else lowerFiles.push(info);

  // Sanity check normalized dimensions are plausible for a human dental arch
  const plausible = width > 30 && width < 90 && height > 5 && height < 40 && depth > 20 && depth < 80;
  // A shared frame is only shared if every stage lands in the same place. Real tooth
  // movement barely shifts a whole-arch bbox centre, so anything past a few mm means
  // the exporter re-origined that file and it needs its own placement.
  const frameOk = result.usesSharedFrame;
  console.log(
    `${name}: stage=${info.stage} verts=${info.verticesCount} dims(w/h/d)=${width.toFixed(1)}/${height.toFixed(1)}/${depth.toFixed(1)}mm frameShift=${frameShift.toFixed(3)}mm ${plausible ? 'OK' : '** SUSPICIOUS DIMENSIONS **'} ${frameOk ? '' : '** FRAME MISMATCH **'}`
  );
}

console.log('\n--- Tooth / gum segmentation ---');
// Triangle share is not area share: crowns are tessellated far more finely than gums, so
// ~90% of triangles is only about half the surface. Area is the number to judge, and it
// should land near half and half on a trimmed arch model. The margin should also be
// deeper at the incisors than at the molars, which the per-arch mean cannot show but a
// grossly wrong estimate will still betray by falling outside 4-9mm.
let segmentationWarnings = 0;
for (const info of [...upperFiles, ...lowerFiles]) {
  const split = splits.get(info.name);
  const geometry = info.customBufferGeometry;
  if (!split || !geometry) {
    console.log(`${info.name}: ** NO SPLIT **`);
    segmentationWarnings++;
    continue;
  }
  const totalTriangles = split.toothTriangles + split.gumTriangles;
  const toothArea = areaOfTriangleRange(geometry, 0, split.toothTriangles);
  const gumArea = areaOfTriangleRange(geometry, split.toothTriangles, split.gumTriangles);
  const areaShare = toothArea / (toothArea + gumArea);
  const groupsOk = geometry.groups.length === 2
    && geometry.groups[0].start === 0
    && geometry.groups[0].count === split.toothTriangles * 3
    && geometry.groups[1].count === split.gumTriangles * 3;

  const areaOk = areaShare > 0.3 && areaShare < 0.7;
  const marginOk = split.meanMarginMm > 4 && split.meanMarginMm < 9;
  const coverageOk = split.detectedFraction > 0.4;
  if (!areaOk || !marginOk || !coverageOk || !groupsOk) segmentationWarnings++;

  console.log(
    `${info.name}: tris tooth=${((split.toothTriangles / totalTriangles) * 100).toFixed(1)}% ` +
    `area tooth=${(areaShare * 100).toFixed(1)}% ${areaOk ? '' : '** AREA SPLIT OFF **'} ` +
    `margin=${split.meanMarginMm.toFixed(2)}mm (${split.minMarginMm.toFixed(2)}-${split.maxMarginMm.toFixed(2)}) ` +
    `${marginOk ? '' : '** MARGIN DEPTH OFF **'} ` +
    `measured=${(split.detectedFraction * 100).toFixed(0)}% of bins ${coverageOk ? '' : '** LOW COVERAGE **'} ` +
    `${groupsOk ? '' : '** GROUPS WRONG **'}`,
  );
}

const sortedUpper = sortSTLFilesByStage(upperFiles);
const sortedLower = sortSTLFilesByStage(lowerFiles);

console.log(`\nUpper stages sorted: ${sortedUpper.map(f => f.stage).join(', ')}`);
console.log(`Lower stages sorted: ${sortedLower.map(f => f.stage).join(', ')}`);

// Measured crown-surface movement. Per-stage peaks should sit at or under the ~0.25mm
// per-stage aligner budget, and the total since stage 1 should grow monotonically.
// That combination is what shows the sequence is a real, progressive correction rather
// than noise or a mis-registered import.
console.log('\n--- Measured crown movement (upper arch) ---');
let previousTotal = 0;
let budgetBreaches = 0;
let monotonicBreaks = 0;

for (const f of sortedUpper) {
  const perStage = computeStageMovement(sortedUpper, sortedLower, f.stage);
  const total = computeStageMovement(sortedUpper, sortedLower, f.stage, true);

  const consecutive = perStage.fromStage === f.stage - 1;
  // Judged on the 95th percentile: a single 0.4mm spot on an otherwise static stage is
  // an attachment or interproximal reduction, not the arch overstepping its budget.
  const overBudget = consecutive && perStage.p95Mm > 0.25;
  if (overBudget) budgetBreaches++;

  const totalMm = total.isMeasured ? total.maxMm : 0;
  // Small tolerance: the total is a sampled percentile, not an exact maximum.
  const regressed = total.isMeasured && totalMm < previousTotal - 0.05;
  if (regressed) monotonicBreaks++;
  if (total.isMeasured) previousTotal = Math.max(previousTotal, totalMm);

  console.log(
    `Stage ${f.stage}: from=${perStage.fromStage ?? '-'} p95=${perStage.p95Mm.toFixed(3)}mm peak=${perStage.maxMm.toFixed(3)}mm mean=${perStage.meanMm.toFixed(3)}mm ` +
    `moved=${((perStage.upper?.movingFraction ?? 0) * 100).toFixed(0)}% | sinceStart peak=${totalMm.toFixed(3)}mm ` +
    `${overBudget ? '** OVER PER-STAGE BUDGET **' : ''}${regressed ? '** TOTAL WENT BACKWARDS **' : ''}`
  );
}

// --- Movement heat map ---
// The colours the viewer paints, checked for the two ways this can be useless: an arch
// where nothing is coloured (so the preview shows no correction at all) and an arch where
// everything is coloured (so nothing stands out and the map says nothing). The grey share
// is the fraction of the surface the map calls unchanged, and on a real arch most of it
// should be grey, because most of a trimmed model is base and gum that does not move.
console.log('\n--- Movement heat map colours (upper arch, vs stage 1) ---');
let heatMapWarnings = 0;
const GREY = [0.78, 0.8, 0.84];

for (const f of sortedUpper) {
  const result = computeMovementColors(sortedUpper, 'upper', f.stage);
  if (!result) {
    // Expected on stage 1, which has nothing earlier to compare against.
    const expected = f.stage <= 1 || f.isTemplate;
    if (!expected) heatMapWarnings++;
    console.log(`stage ${f.stage}: no heat map ${expected ? '(expected)' : '** UNEXPECTED **'}`);
    continue;
  }

  const vertexCount = result.colors.length / 3;
  let grey = 0;
  let hot = 0;
  for (let i = 0; i < vertexCount; i++) {
    const r = result.colors[i * 3];
    const g = result.colors[i * 3 + 1];
    const b = result.colors[i * 3 + 2];
    if (Math.abs(r - GREY[0]) < 0.01 && Math.abs(g - GREY[1]) < 0.01 && Math.abs(b - GREY[2]) < 0.01) {
      grey++;
    } else if (r > 0.85 && g < 0.35) {
      hot++;
    }
  }
  const greyShare = grey / vertexCount;
  const hotShare = hot / vertexCount;

  const usefulSpread = greyShare > 0.05 && greyShare < 0.995;
  const scaleOk = result.scaleMm >= 0.2 && result.scaleMm < 8;
  if (!usefulSpread || !scaleOk) heatMapWarnings++;

  console.log(
    `stage ${String(f.stage).padStart(2)}: scale=${result.scaleMm.toFixed(2)}mm ` +
    `unchanged=${(greyShare * 100).toFixed(1)}% at-top-of-ramp=${(hotShare * 100).toFixed(2)}% ` +
    `${usefulSpread ? '' : '** NO USEFUL SPREAD **'}${scaleOk ? '' : ' ** SCALE OFF **'}`,
  );
}

console.log(
  `\nPer-stage budget breaches: ${budgetBreaches} | total-movement regressions: ${monotonicBreaks} ` +
  `| segmentation warnings: ${segmentationWarnings} ` +
  `| heat map warnings: ${heatMapWarnings} ` +
  `${budgetBreaches === 0 && monotonicBreaks === 0 && segmentationWarnings === 0 && heatMapWarnings === 0
    ? 'OK'
    : '** REVIEW **'}`
);

// --- Bite/occlusion verification ---
// Independently re-measures yaw + midline (should now be ~0 after normalizeDentalGeometry's
// yaw-zeroing + midline-centering) and checks the computed occlusion offset produces a
// plausible, bounded contact (not a runaway penetration or a total miss).
function measureYawDeg(geometry: THREE.BufferGeometry): number {
  const pos = geometry.attributes.position;
  const n = pos.count;
  let mx = 0, mz = 0;
  for (let i = 0; i < n; i++) { mx += pos.getX(i); mz += pos.getZ(i); }
  mx /= n; mz /= n;
  let sxx = 0, sxz = 0, szz = 0;
  for (let i = 0; i < n; i++) {
    const dx = pos.getX(i) - mx, dz = pos.getZ(i) - mz;
    sxx += dx * dx; sxz += dx * dz; szz += dz * dz;
  }
  return (0.5 * Math.atan2(2 * sxz, sxx - szz)) * (180 / Math.PI);
}

function measureMidlineX(geometry: THREE.BufferGeometry): number {
  const pos = geometry.attributes.position;
  geometry.computeBoundingBox();
  const cutoff = geometry.boundingBox!.max.z - 3;
  let sum = 0, count = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getZ(i) > cutoff) { sum += pos.getX(i); count++; }
  }
  return count > 0 ? sum / count : NaN;
}

// Only the reference stage of an arch is self-centred. Every later stage inherits that
// stage's transform, so its own yaw and midline drift as the teeth move - that drift is
// the movement being visualised, not a registration fault.
function checkBitePair(upperName: string, lowerName: string, isReferencePair: boolean) {
  const upper = sortedUpper.find(f => f.name === upperName);
  const lower = sortedLower.find(f => f.name === lowerName);
  if (!upper?.customBufferGeometry || !lower?.customBufferGeometry) {
    console.log(`  SKIP: could not find geometry for ${upperName} / ${lowerName}`);
    return;
  }
  const upperGeom = upper.customBufferGeometry;
  const lowerGeom = lower.customBufferGeometry;

  const upperYaw = measureYawDeg(upperGeom);
  const lowerYaw = measureYawDeg(lowerGeom);
  const upperMidline = measureMidlineX(upperGeom);
  const lowerMidline = measureMidlineX(lowerGeom);

  const offset = computeOcclusionOffset(upperGeom, lowerGeom);

  // Apply the full correction (tilt + translation) and re-run the fit once more:
  // the residual pitch/roll on this second pass should be close to zero if the
  // tilt correction actually removed the systematic gap slope (not just anchored
  // to one contact point).
  const shifted = lowerGeom.clone();
  shifted.rotateX(offset.pitchRad);
  shifted.rotateZ(offset.rollRad);
  shifted.translate(offset.dx, offset.dy, offset.dz);
  upperGeom.computeBoundingBox();
  shifted.computeBoundingBox();
  const yOverlap = Math.min(upperGeom.boundingBox!.max.y, shifted.boundingBox!.max.y) -
    Math.max(upperGeom.boundingBox!.min.y, shifted.boundingBox!.min.y);
  const residualFit = computeOcclusionOffset(upperGeom, shifted);

  const yawTolerance = isReferencePair ? 0.5 : 6;
  const midlineTolerance = isReferencePair ? 0.5 : 4;
  const yawOk = Math.abs(upperYaw) < yawTolerance && Math.abs(lowerYaw) < yawTolerance;
  const midlineOk = Math.abs(upperMidline) < midlineTolerance && Math.abs(lowerMidline) < midlineTolerance;
  const contactOk = offset.contactCells > 50 && yOverlap > 0 && yOverlap < 20;
  const tiltConverged = Math.abs(residualFit.pitchRad) < 0.01 && Math.abs(residualFit.rollRad) < 0.01; // < ~0.6deg residual

  console.log(`${upperName} + ${lowerName}`);
  console.log(`  ${isReferencePair ? 'reference stages (expect ~0)' : 'later stages (drift expected)'}`);
  console.log(`  yaw: upper=${upperYaw.toFixed(3)}deg lower=${lowerYaw.toFixed(3)}deg ${yawOk ? 'OK' : '** YAW MISALIGNED **'}`);
  console.log(`  midline: upper=${upperMidline.toFixed(3)}mm lower=${lowerMidline.toFixed(3)}mm ${midlineOk ? 'OK' : '** MIDLINE MISALIGNED **'}`);
  console.log(`  occlusion offset: dx=${offset.dx} dy=${offset.dy.toFixed(3)} dz=${offset.dz} pitchDeg=${(offset.pitchRad * 180 / Math.PI).toFixed(3)} rollDeg=${(offset.rollRad * 180 / Math.PI).toFixed(3)} contactCells=${offset.contactCells} bboxYOverlap=${yOverlap.toFixed(2)}mm ${contactOk ? 'OK' : '** SUSPICIOUS CONTACT **'}`);
  console.log(`  residual tilt after correction: pitchDeg=${(residualFit.pitchRad * 180 / Math.PI).toFixed(3)} rollDeg=${(residualFit.rollRad * 180 / Math.PI).toFixed(3)} ${tiltConverged ? 'OK (converged)' : '** TILT DID NOT CONVERGE **'}`);
}

console.log('\n--- Bite/occlusion verification ---');
checkBitePair('Krishnapriya Upper jaw - 25 - Model.stl', 'Krishnapriya Lower jaw - 07 - Model.stl', false);
checkBitePair('Krishnapriya Upper jaw - 01 - Model.stl', 'Krishnapriya Lower jaw - 01 - Model.stl', true);

console.log('\nDone.');
