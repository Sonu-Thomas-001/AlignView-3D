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
import { STLLoader } from 'three-stdlib';
import {
  parseSTLFilename,
  detectBatchPatientName,
  sortSTLFilesByStage,
  computeDentalNormalization,
  applyDentalNormalization,
  computeGeometryPose,
} from '../src/utils/stlParser';
import { computeStageMovement } from '../src/utils/movementAnalytics';
import { computeOcclusionOffset } from '../src/utils/occlusion';
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
const loader = new STLLoader();
const upperFiles: STLFileInfo[] = [];
const lowerFiles: STLFileInfo[] = [];

// Mirrors the import pipeline: one placement transform per arch, derived from the
// earliest non-template stage, applied to every stage of that arch. Deriving it per
// stage would re-centre each stage and cancel out the tooth movement being measured.
const archFrames: Partial<Record<'upper' | 'lower', THREE.Matrix4>> = {};
const archRefCenters: Partial<Record<'upper' | 'lower', THREE.Vector3>> = {};

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

  const geometry = loader.parse(arrayBuffer);
  const rawPose = computeGeometryPose(geometry);

  if (!archFrames[arch]) archFrames[arch] = computeDentalNormalization(geometry, arch);
  applyDentalNormalization(geometry, archFrames[arch]!);

  const placedCenter = new THREE.Vector3();
  geometry.boundingBox!.getCenter(placedCenter);
  if (!archRefCenters[arch]) archRefCenters[arch] = placedCenter.clone();
  const frameShift = placedCenter.distanceTo(archRefCenters[arch]!);

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const width = bbox.max.x - bbox.min.x;
  const height = bbox.max.y - bbox.min.y;
  const depth = bbox.max.z - bbox.min.z;

  const info: STLFileInfo = {
    id: `stl_${name}`,
    name,
    arch,
    stage: meta.stage ?? 1,
    date: '',
    fileSize: '',
    verticesCount: geometry.attributes.position.count,
    trianglesCount: Math.round(geometry.attributes.position.count / 3),
    dimensions: { width, depth, height },
    isTemplate: meta.isTemplate,
    centroid: { x: rawPose.centroid.x, y: rawPose.centroid.y, z: rawPose.centroid.z },
    principalAxis: { x: rawPose.principalAxis.x, y: rawPose.principalAxis.y, z: rawPose.principalAxis.z },
    customBufferGeometry: geometry,
  };

  if (arch === 'upper') upperFiles.push(info);
  else lowerFiles.push(info);

  // Sanity check normalized dimensions are plausible for a human dental arch
  const plausible = width > 30 && width < 90 && height > 5 && height < 40 && depth > 20 && depth < 80;
  // A shared frame is only shared if every stage lands in the same place. Real tooth
  // movement barely shifts a whole-arch bbox centre, so anything past a few mm means
  // the exporter re-origined that file and it needs its own placement.
  const frameOk = frameShift < 5;
  console.log(
    `${name}: stage=${info.stage} verts=${info.verticesCount} dims(w/h/d)=${width.toFixed(1)}/${height.toFixed(1)}/${depth.toFixed(1)}mm frameShift=${frameShift.toFixed(3)}mm ${plausible ? 'OK' : '** SUSPICIOUS DIMENSIONS **'} ${frameOk ? '' : '** FRAME MISMATCH **'}`
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

console.log(
  `\nPer-stage budget breaches: ${budgetBreaches} | total-movement regressions: ${monotonicBreaks} ` +
  `${budgetBreaches === 0 && monotonicBreaks === 0 ? 'OK' : '** REVIEW **'}`
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
