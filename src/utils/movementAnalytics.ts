import * as THREE from 'three';
import { STLFileInfo } from '@/types/dental';

/**
 * Real Clear-Aligner Stage-to-Stage Movement Estimation
 *
 * Unlike a per-tooth biomechanical simulation (which would require tooth
 * segmentation we don't perform), this derives a real, geometry-based
 * whole-arch movement estimate directly from the uploaded STL sequence:
 * - Translation: Euclidean distance between the current and previous stage's
 *   raw vertex centroid (captured pre-normalization in `computeGeometryPose`).
 * - Rotation: angle between the current and previous stage's dominant
 *   principal axis (PCA on vertex positions).
 *
 * Clinical budget benchmarks (Invisalign / SureSmile / OpenSourceOrtho):
 * - Max Translation: 0.25 mm per stage
 * - Max Rotation: 2.0 degrees per stage
 */

export interface StageSafetyMetrics {
  stage: number;
  maxTranslationMm: number;
  maxRotationDeg: number;
  isTranslationSafe: boolean;
  isRotationSafe: boolean;
  isOverallSafe: boolean;
  dominantArch: string;
  status: 'optimal' | 'moderate' | 'exceeded' | 'baseline';
  statusMessage: string;
}

function findFile(files: STLFileInfo[], stage: number): STLFileInfo | undefined {
  return files.find(f => f.stage === stage);
}

function findPriorFile(files: STLFileInfo[], stage: number): STLFileInfo | undefined {
  return [...files]
    .filter(f => (f.stage ?? 0) < stage)
    .sort((a, b) => (b.stage ?? 0) - (a.stage ?? 0))[0];
}

export function archMovement(files: STLFileInfo[], stage: number): { translationMm: number; rotationDeg: number } | null {
  const current = findFile(files, stage);
  const prior = findPriorFile(files, stage);
  if (!current?.centroid || !prior?.centroid) return null;

  const c1 = new THREE.Vector3(prior.centroid.x, prior.centroid.y, prior.centroid.z);
  const c2 = new THREE.Vector3(current.centroid.x, current.centroid.y, current.centroid.z);
  const translationMm = c1.distanceTo(c2);

  let rotationDeg = 0;
  if (current.principalAxis && prior.principalAxis) {
    const a1 = new THREE.Vector3(prior.principalAxis.x, prior.principalAxis.y, prior.principalAxis.z).normalize();
    const a2 = new THREE.Vector3(current.principalAxis.x, current.principalAxis.y, current.principalAxis.z).normalize();
    // The principal axis has an arbitrary sign (PCA eigenvectors aren't oriented),
    // so use the absolute dot product to get the smaller of the two angles.
    const dot = Math.min(1, Math.max(-1, Math.abs(a1.dot(a2))));
    rotationDeg = Math.acos(dot) * (180 / Math.PI);
  }

  return { translationMm, rotationDeg };
}

/**
 * Computes a real, geometry-derived movement estimate between the given stage
 * and the immediately preceding stage present in the uploaded upper/lower sequences.
 */
export function computeStageSafetyMetrics(
  upperFiles: STLFileInfo[],
  lowerFiles: STLFileInfo[],
  stage: number
): StageSafetyMetrics {
  const upperMove = archMovement(upperFiles, stage);
  const lowerMove = archMovement(lowerFiles, stage);

  if (!upperMove && !lowerMove) {
    return {
      stage,
      maxTranslationMm: 0,
      maxRotationDeg: 0,
      isTranslationSafe: true,
      isRotationSafe: true,
      isOverallSafe: true,
      dominantArch: 'N/A',
      status: 'baseline',
      statusMessage: stage <= 1
        ? 'Baseline stage — no prior stage available for comparison.'
        : 'No comparable prior-stage geometry found for this arch sequence.',
    };
  }

  const upperTranslation = upperMove?.translationMm ?? 0;
  const lowerTranslation = lowerMove?.translationMm ?? 0;
  const upperRotation = upperMove?.rotationDeg ?? 0;
  const lowerRotation = lowerMove?.rotationDeg ?? 0;

  const dominantArch = upperTranslation >= lowerTranslation ? 'Upper Arch' : 'Lower Arch';
  const maxTranslationMm = Number(Math.max(upperTranslation, lowerTranslation).toFixed(2));
  const maxRotationDeg = Number(Math.max(upperRotation, lowerRotation).toFixed(1));

  const isTranslationSafe = maxTranslationMm <= 0.25;
  const isRotationSafe = maxRotationDeg <= 2.0;
  const isOverallSafe = isTranslationSafe && isRotationSafe;

  let status: StageSafetyMetrics['status'] = 'optimal';
  let statusMessage = 'Within safe biological velocity for whole-arch centroid shift.';

  if (!isOverallSafe) {
    status = 'exceeded';
    statusMessage = 'Exceeds clinical budget (> 0.25 mm or > 2.0°) between consecutive stage STLs; verify stage sequence and tracking.';
  } else if (maxTranslationMm > 0.20 || maxRotationDeg > 1.6) {
    status = 'moderate';
    statusMessage = 'Active movement phase (0.20 – 0.25 mm) detected in the whole-arch centroid shift.';
  }

  return {
    stage,
    maxTranslationMm,
    maxRotationDeg,
    isTranslationSafe,
    isRotationSafe,
    isOverallSafe,
    dominantArch,
    status,
    statusMessage,
  };
}
