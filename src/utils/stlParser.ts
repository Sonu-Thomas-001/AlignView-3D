import * as THREE from 'three';
import { STLFileInfo } from '@/types/dental';

export interface ParsedSTLMeta {
  arch: 'upper' | 'lower' | 'unknown';
  stage?: number;
  isTemplate: boolean;
  patientName?: string;
  cleanName: string;
}

/**
 * Parses a single STL filename to determine arch type (upper/lower),
 * treatment stage number, template identification, and patient name.
 */
export function parseSTLFilename(filename: string): ParsedSTLMeta {
  // Strip extension
  const baseName = filename.replace(/\.stl$/i, '').trim();

  let arch: 'upper' | 'lower' | 'unknown' = 'unknown';
  let stage: number | undefined = undefined;
  let patientName: string | undefined = undefined;

  // Detect Template file
  const isTemplate = /\b(?:template|tmpl|tmplte)\b|[-_\s]template[-_\s]/i.test(baseName);

  // 1. Detect Arch Type
  const upperPattern = /\b(upper\s*jaw|upperjaw|upper|maxillary|maxilla|max)\b|([_\-\s]u\d+)|(^u\d+)/i;
  const lowerPattern = /\b(lower\s*jaw|lowerjaw|lower|mandibular|mandible|mand)\b|([_\-\s]l\d+)|(^l\d+)/i;

  const upperMatch = baseName.match(upperPattern);
  const lowerMatch = baseName.match(lowerPattern);

  if (upperMatch && !lowerMatch) {
    arch = 'upper';
  } else if (lowerMatch && !upperMatch) {
    arch = 'lower';
  } else if (upperMatch && lowerMatch) {
    // Whichever match appears first or is more specific
    arch = upperMatch.index! <= lowerMatch.index! ? 'upper' : 'lower';
  }

  // 2. Extract Stage Number
  // Pattern A: " - 22 - " or " - 02 - " (e.g., "Krishnapriya Upper jaw - 22 - Model")
  const hyphenStageMatch = baseName.match(/[-_]\s*(\d{1,3})\s*[-_]/);
  if (hyphenStageMatch) {
    stage = parseInt(hyphenStageMatch[1], 10);
  }

  // Pattern B: "Stage 05", "Step 12", "Aligner 3", "S02"
  if (stage === undefined) {
    const stageKeywordMatch = baseName.match(/(?:stage|step|aligner|align|stg|st|s)[\s_\-#]*(\d{1,3})\b/i);
    if (stageKeywordMatch) {
      stage = parseInt(stageKeywordMatch[1], 10);
    }
  }

  // Pattern C: "U05", "L12", "Upper_08", "Lower_15"
  if (stage === undefined) {
    const uOrLMatch = baseName.match(/(?:[_\-\s]|^)[ul](\d{1,3})\b/i);
    if (uOrLMatch) {
      stage = parseInt(uOrLMatch[1], 10);
    }
  }

  // Pattern D: Trailing number or isolated number
  if (stage === undefined) {
    const isolatedNumMatch = baseName.match(/(?:^|\s|[_\-])(\d{1,3})(?:$|\s|[_\-])/);
    if (isolatedNumMatch) {
      stage = parseInt(isolatedNumMatch[1], 10);
    }
  }

  // If stage is still undefined and it is a template, default to Stage 1
  if (stage === undefined && isTemplate) {
    stage = 1;
  }

  // 3. Extract Patient Name
  // Look for text prefix preceding the arch indicator or stage marker
  const splitKeywords = /(?:\s*[-_]?\s*(?:upper\s*jaw|lower\s*jaw|upperjaw|lowerjaw|upper|lower|maxillary|mandibular|maxilla|mandible|stage|step|aligner|model|template)[-_]?\s*)/i;
  const parts = baseName.split(splitKeywords);

  if (parts.length > 0 && parts[0].trim().length > 1) {
    let candidate = parts[0]
      .replace(/[-_]+$/, '')
      .replace(/^[-_]+/, '')
      .trim();

    // Avoid taking generic words as patient names
    const genericWords = /^(model|scan|arch|jaw|treatment|setup|aligner|stl|export|case|patient|template)$/i;
    if (candidate && !genericWords.test(candidate) && !/^\d+$/.test(candidate)) {
      patientName = candidate;
    }
  }

  return {
    arch,
    stage,
    isTemplate,
    patientName,
    cleanName: baseName,
  };
}

/**
 * Given a list of filenames from a batch upload, discovers the consensus Patient Name.
 */
export function detectBatchPatientName(filenames: string[]): string | undefined {
  if (filenames.length === 0) return undefined;

  const namesCount = new Map<string, number>();

  for (const name of filenames) {
    const parsed = parseSTLFilename(name);
    if (parsed.patientName) {
      const trimmed = parsed.patientName.trim();
      namesCount.set(trimmed, (namesCount.get(trimmed) || 0) + 1);
    }
  }

  let bestName: string | undefined = undefined;
  let maxCount = 0;

  namesCount.forEach((count, name) => {
    if (count > maxCount) {
      maxCount = count;
      bestName = name;
    }
  });

  return bestName;
}

/**
 * Sorts STL files sequentially by their stage number.
 */
export function sortSTLFilesByStage(files: STLFileInfo[]): STLFileInfo[] {
  return [...files].sort((a, b) => {
    const stageA = a.stage ?? 999;
    const stageB = b.stage ?? 999;
    if (stageA !== stageB) return stageA - stageB;

    // Prioritize Template files before Model files for the same stage
    const isTemplateA = /template/i.test(a.name);
    const isTemplateB = /template/i.test(b.name);
    if (isTemplateA && !isTemplateB) return -1;
    if (!isTemplateA && isTemplateB) return 1;

    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Resolves which file in an arch sequence should be displayed for a given treatment
 * stage. Prefers an exact stage match (favouring the "Model" file over a "Template"
 * file at the same stage), otherwise falls back to the nearest earlier stage, and
 * finally to the last file available.
 *
 * The fallback matters because the two arches of a real case rarely have the same
 * number of stages - the sample case ships 25 upper stages against 7 lower ones - so
 * the shorter arch has to hold its final position rather than disappear.
 */
export function pickFileForStage(files: STLFileInfo[], stage: number): STLFileInfo | undefined {
  if (files.length === 0) return undefined;

  const exact = files.filter(f => f.stage === stage);
  if (exact.length > 0) {
    return exact.find(f => !f.isTemplate) ?? exact[0];
  }

  const earlier = files
    .filter(f => (f.stage ?? 0) < stage)
    .sort((a, b) => (b.stage ?? 0) - (a.stage ?? 0));
  if (earlier.length > 0) {
    const bestStage = earlier[0].stage;
    const atBestStage = earlier.filter(f => f.stage === bestStage);
    return atBestStage.find(f => !f.isTemplate) ?? atBestStage[0];
  }

  const sorted = sortSTLFilesByStage(files);
  return sorted[0];
}

/** Highest stage number present in an arch sequence (0 when the arch is empty). */
export function maxStageOf(files: STLFileInfo[]): number {
  return files.reduce((max, f) => Math.max(max, f.stage ?? 0), 0);
}

/**
 * Computes the vertex centroid and dominant principal axis (via PCA / power iteration
 * on the covariance matrix) of a freshly-parsed, not-yet-normalized STL geometry.
 *
 * This is captured BEFORE `normalizeDentalGeometry` re-centers the mesh for rendering,
 * so it preserves the arch's real position/orientation in the file's native coordinate
 * frame. Because rotation is distance- and angle-preserving, Euclidean distance between
 * two stages' centroids (and the angle between their principal axes) is a valid real
 * movement estimate even without replaying the later normalization rotations - as long
 * as every stage of a case was exported by the CAD software in a consistent world frame,
 * which is standard practice for multi-stage aligner treatment planning exports.
 */
export function computeGeometryPose(geometry: THREE.BufferGeometry): { centroid: THREE.Vector3; principalAxis: THREE.Vector3 } {
  const pos = geometry.attributes.position;
  const n = pos.count;
  const centroid = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    centroid.x += pos.getX(i);
    centroid.y += pos.getY(i);
    centroid.z += pos.getZ(i);
  }
  centroid.divideScalar(Math.max(1, n));

  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
  for (let i = 0; i < n; i++) {
    const dx = pos.getX(i) - centroid.x;
    const dy = pos.getY(i) - centroid.y;
    const dz = pos.getZ(i) - centroid.z;
    xx += dx * dx; xy += dx * dy; xz += dx * dz;
    yy += dy * dy; yz += dy * dz; zz += dz * dz;
  }
  xx /= n; xy /= n; xz /= n; yy /= n; yz /= n; zz /= n;

  // Power iteration to find the dominant eigenvector of the symmetric covariance matrix
  const cov = new THREE.Matrix3().set(
    xx, xy, xz,
    xy, yy, yz,
    xz, yz, zz,
  );
  let axis = new THREE.Vector3(1, 1, 1).normalize();
  for (let i = 0; i < 40; i++) {
    axis.applyMatrix3(cov);
    if (axis.lengthSq() < 1e-20) {
      axis.set(1, 0, 0);
      break;
    }
    axis.normalize();
  }

  return { centroid, principalAxis: axis };
}

/**
 * Rotates a geometry around Y so its horizontal (X/Z) footprint's principal axis
 * aligns with X — i.e. removes arch yaw. Uses the closed-form 2D PCA angle rather
 * than the 3D power-iteration in `computeGeometryPose`, since we only care about
 * rotation in a single plane here.
 */
function zeroArchYaw(geometry: THREE.BufferGeometry): void {
  const pos = geometry.attributes.position;
  const n = pos.count;
  if (n === 0) return;

  let mx = 0, mz = 0;
  for (let i = 0; i < n; i++) {
    mx += pos.getX(i);
    mz += pos.getZ(i);
  }
  mx /= n; mz /= n;

  let sxx = 0, sxz = 0, szz = 0;
  for (let i = 0; i < n; i++) {
    const dx = pos.getX(i) - mx;
    const dz = pos.getZ(i) - mz;
    sxx += dx * dx;
    sxz += dx * dz;
    szz += dz * dz;
  }

  const theta = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  geometry.rotateY(theta);
}

/**
 * Automatically normalizes imported dental mesh orientation into standard Three.js dental studio coordinates:
 * - X: Transverse / Left-Right (Arch width)
 * - Y: Vertical / Superior-Inferior (Height)
 * - Z: Sagittal / Anterior-Posterior (Incisors at +Z, Molars at -Z)
 */
export function normalizeDentalGeometry(geometry: THREE.BufferGeometry, arch: 'upper' | 'lower'): THREE.BufferGeometry {
  geometry.computeVertexNormals();
  geometry.center();

  // 1. Check initial bounding box
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const size = new THREE.Vector3();
  bbox.getSize(size);

  // Dental scan dimensions:
  // Height (Y) is always the smallest axis (~12 - 28 mm)
  // Width (X) and Depth (Z) are larger (~45 - 75 mm)
  if (size.z < size.x && size.z < size.y) {
    // Height is in Z axis (CAD software export with Z-up) -> rotate into Y
    geometry.rotateX(-Math.PI / 2);
  } else if (size.x < size.y && size.x < size.z) {
    // Height is in X axis -> rotate into Y
    geometry.rotateZ(Math.PI / 2);
  }

  geometry.computeBoundingBox();
  const sizeAfterHeight = new THREE.Vector3();
  geometry.boundingBox!.getSize(sizeAfterHeight);

  // 1b. Zero out arch yaw so every stage/arch shares one width axis (X).
  // CAD exports commonly have a few degrees of yaw baked in; PCA on the
  // horizontal (X/Z) footprint finds the arch's true long axis and rotates
  // it onto X, which is what lets upper/lower (and stage-to-stage) meshes
  // line up without a visible twist in "Both Arches" view.
  zeroArchYaw(geometry);
  geometry.computeBoundingBox();
  geometry.boundingBox!.getSize(sizeAfterHeight);

  // 2. Align Anterior (Incisors at front +Z) vs Posterior (Molars at back -Z)
  // In a dental arch, the anterior incisor region is narrower in X than the posterior molar region
  const pos = geometry.attributes.position;
  let frontWidth = 0;
  let frontCount = 0;
  let backWidth = 0;
  let backCount = 0;

  const halfDepth = sizeAfterHeight.z * 0.25;

  for (let i = 0; i < pos.count; i += 6) {
    const x = Math.abs(pos.getX(i));
    const z = pos.getZ(i);

    if (z > halfDepth) {
      frontWidth += x;
      frontCount++;
    } else if (z < -halfDepth) {
      backWidth += x;
      backCount++;
    }
  }

  const avgFrontX = frontCount > 0 ? frontWidth / frontCount : 0;
  const avgBackX = backCount > 0 ? backWidth / backCount : 0;

  // If front is wider than back, arch is facing backwards -> rotate 180 deg around Y
  if (avgFrontX > avgBackX && backCount > 10) {
    geometry.rotateY(Math.PI);
  }

  // 3. Occlusal Plane Orientation (Crowns vs Base)
  // For Upper Arch: Teeth crowns should point DOWN (towards -Y, occlusal contact), base on top (+Y)
  // For Lower Arch: Teeth crowns should point UP (towards +Y, occlusal contact), base on bottom (-Y)
  // We check the curvature / surface normals or vertex density near the occlusal edges vs the flat base cut:
  let topCuspCount = 0;
  let bottomCuspCount = 0;
  const halfHeight = sizeAfterHeight.y * 0.25;

  for (let i = 0; i < pos.count; i += 6) {
    const y = pos.getY(i);
    if (y > halfHeight) topCuspCount++;
    else if (y < -halfHeight) bottomCuspCount++;
  }

  // If upper arch has base at bottom instead of top, flip it around X
  // Dental crowns have more detailed/higher surface area than flat horseshoe bases
  if (arch === 'upper') {
    // In upper jaw, crowns point down (-Y) and gums/base are up (+Y)
    // If crowns are currently facing up, flip X
    if (topCuspCount > bottomCuspCount * 1.4) {
      geometry.rotateX(Math.PI);
      geometry.rotateY(Math.PI); // keep front facing forward
    }
  } else {
    // In lower jaw, crowns point up (+Y) and base is down (-Y)
    if (bottomCuspCount > topCuspCount * 1.4) {
      geometry.rotateX(Math.PI);
      geometry.rotateY(Math.PI);
    }
  }

  geometry.computeVertexNormals();

  // Final centering: center Y/Z on the bounding box as before, but center X on
  // the dental midline (mean X of the anterior-most 3mm incisor band) rather
  // than the bbox center. The horseshoe-shaped base skews the bbox center away
  // from true anatomical midline, which is what previously left upper/lower
  // arches laterally offset from each other in "Both Arches" view.
  geometry.computeBoundingBox();
  const finalBbox = geometry.boundingBox!;
  const anteriorCutoffZ = finalBbox.max.z - 3;

  let midlineSumX = 0;
  let midlineCount = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getZ(i) > anteriorCutoffZ) {
      midlineSumX += pos.getX(i);
      midlineCount++;
    }
  }

  const midlineX = midlineCount > 0 ? midlineSumX / midlineCount : (finalBbox.min.x + finalBbox.max.x) / 2;
  const centerY = (finalBbox.min.y + finalBbox.max.y) / 2;
  const centerZ = (finalBbox.min.z + finalBbox.max.z) / 2;

  geometry.translate(-midlineX, -centerY, -centerZ);

  return geometry;
}

