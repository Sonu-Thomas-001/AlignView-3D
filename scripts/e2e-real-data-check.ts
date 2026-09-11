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
  normalizeDentalGeometry,
  computeGeometryPose,
} from '../src/utils/stlParser';
import { computeStageSafetyMetrics } from '../src/utils/movementAnalytics';
import { STLFileInfo } from '../src/types/dental';

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

for (const name of filenames) {
  const meta = parseSTLFilename(name);
  const arch = meta.arch === 'lower' ? 'lower' : 'upper';
  const buffer = fs.readFileSync(path.join(STL_DIR, name));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  let geometry = loader.parse(arrayBuffer);
  const rawPose = computeGeometryPose(geometry);
  geometry = normalizeDentalGeometry(geometry, arch);

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
  };

  if (arch === 'upper') upperFiles.push(info);
  else lowerFiles.push(info);

  // Sanity check normalized dimensions are plausible for a human dental arch
  const plausible = width > 30 && width < 90 && height > 5 && height < 40 && depth > 20 && depth < 80;
  console.log(
    `${name}: stage=${info.stage} verts=${info.verticesCount} dims(w/h/d)=${width.toFixed(1)}/${height.toFixed(1)}/${depth.toFixed(1)}mm ${plausible ? 'OK' : '** SUSPICIOUS DIMENSIONS **'}`
  );
}

const sortedUpper = sortSTLFilesByStage(upperFiles);
const sortedLower = sortSTLFilesByStage(lowerFiles);

console.log(`\nUpper stages sorted: ${sortedUpper.map(f => f.stage).join(', ')}`);
console.log(`Lower stages sorted: ${sortedLower.map(f => f.stage).join(', ')}`);

console.log('\n--- Real stage-to-stage movement (upper arch) ---');
for (const f of sortedUpper) {
  const metrics = computeStageSafetyMetrics(sortedUpper, sortedLower, f.stage);
  console.log(
    `Stage ${f.stage}: translation=${metrics.maxTranslationMm}mm rotation=${metrics.maxRotationDeg}deg status=${metrics.status} dominantArch=${metrics.dominantArch}`
  );
}

console.log('\nDone.');
