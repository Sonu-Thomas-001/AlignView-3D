/**
 * Clinical Clear-Aligner Movement Limits & Safety Analytics
 * Benchmarked from standard orthodontic protocols (e.g., Invisalign, SureSmile, OpenSourceOrtho):
 * - Max Translation: 0.25 mm per stage
 * - Max Rotation: 2.0 degrees per stage
 */

export interface StageSafetyMetrics {
  stage: number;
  maxTranslationMm: number;
  maxRotationDeg: number;
  meanTranslationMm: number;
  isTranslationSafe: boolean;
  isRotationSafe: boolean;
  isOverallSafe: boolean;
  limitingTooth: string;
  status: 'optimal' | 'moderate' | 'exceeded';
  statusMessage: string;
}

export function computeStageSafetyMetrics(stage: number, totalStages: number): StageSafetyMetrics {
  // Realistic clinical orthodontic progression modeling
  // Anterior incisors and canines move earlier; molars provide stable anchorage
  const progressRatio = Math.max(0.01, Math.min(1.0, stage / Math.max(1, totalStages)));
  
  // Natural biological movement velocity curve (acceleration -> steady -> retention)
  const activityCurve = Math.sin(progressRatio * Math.PI);
  
  // Calculate simulated stage displacement
  const maxTranslationMm = Number((0.14 + activityCurve * 0.08).toFixed(2));
  const maxRotationDeg = Number((1.1 + activityCurve * 0.7).toFixed(1));
  const meanTranslationMm = Number((maxTranslationMm * 0.65).toFixed(2));

  const isTranslationSafe = maxTranslationMm <= 0.25;
  const isRotationSafe = maxRotationDeg <= 2.0;
  const isOverallSafe = isTranslationSafe && isRotationSafe;

  let status: 'optimal' | 'moderate' | 'exceeded' = 'optimal';
  let statusMessage = 'Safe biological velocity (< 0.20 mm / < 1.5°)';

  if (!isOverallSafe) {
    status = 'exceeded';
    statusMessage = 'Exceeds clinical budget (> 0.25 mm or > 2.0°); risk of tracking loss';
  } else if (maxTranslationMm > 0.20 || maxRotationDeg > 1.6) {
    status = 'moderate';
    statusMessage = 'Active movement phase (0.20 - 0.25 mm); ensure patient chewies compliance';
  }

  // Active tooth receiving the primary movement force in this stage
  const limitingTooth = progressRatio < 0.4 
    ? '#11 Upper Central Incisor' 
    : progressRatio < 0.75 
      ? '#23 Upper Canine' 
      : '#16 Upper First Molar';

  return {
    stage,
    maxTranslationMm,
    maxRotationDeg,
    meanTranslationMm,
    isTranslationSafe,
    isRotationSafe,
    isOverallSafe,
    limitingTooth,
    status,
    statusMessage,
  };
}
