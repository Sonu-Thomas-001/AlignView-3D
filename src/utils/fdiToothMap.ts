import * as THREE from 'three';

export interface FDIToothInfo {
  fdi: number;
  name: string;
  shortName: string;
  quadrant: string;
  quadrantNumber: number;
  arch: 'upper' | 'lower';
  side: 'right' | 'left';
  type: 'incisor' | 'canine' | 'premolar' | 'molar';
  approxAngle: number; // approximate radian angle along arch curve
}

export const FDI_TEETH_MAP: Record<number, FDIToothInfo> = {
  // Maxillary / Upper Right (Quadrant 1)
  11: { fdi: 11, name: 'Upper Right Central Incisor', shortName: 'UR1', quadrant: 'Upper Right (Q1)', quadrantNumber: 1, arch: 'upper', side: 'right', type: 'incisor', approxAngle: 0.10 },
  12: { fdi: 12, name: 'Upper Right Lateral Incisor', shortName: 'UR2', quadrant: 'Upper Right (Q1)', quadrantNumber: 1, arch: 'upper', side: 'right', type: 'incisor', approxAngle: 0.28 },
  13: { fdi: 13, name: 'Upper Right Canine', shortName: 'UR3', quadrant: 'Upper Right (Q1)', quadrantNumber: 1, arch: 'upper', side: 'right', type: 'canine', approxAngle: 0.50 },
  14: { fdi: 14, name: 'Upper Right First Premolar', shortName: 'UR4', quadrant: 'Upper Right (Q1)', quadrantNumber: 1, arch: 'upper', side: 'right', type: 'premolar', approxAngle: 0.72 },
  15: { fdi: 15, name: 'Upper Right Second Premolar', shortName: 'UR5', quadrant: 'Upper Right (Q1)', quadrantNumber: 1, arch: 'upper', side: 'right', type: 'premolar', approxAngle: 0.94 },
  16: { fdi: 16, name: 'Upper Right First Molar', shortName: 'UR6', quadrant: 'Upper Right (Q1)', quadrantNumber: 1, arch: 'upper', side: 'right', type: 'molar', approxAngle: 1.18 },
  17: { fdi: 17, name: 'Upper Right Second Molar', shortName: 'UR7', quadrant: 'Upper Right (Q1)', quadrantNumber: 1, arch: 'upper', side: 'right', type: 'molar', approxAngle: 1.42 },

  // Maxillary / Upper Left (Quadrant 2)
  21: { fdi: 21, name: 'Upper Left Central Incisor', shortName: 'UL1', quadrant: 'Upper Left (Q2)', quadrantNumber: 2, arch: 'upper', side: 'left', type: 'incisor', approxAngle: -0.10 },
  22: { fdi: 22, name: 'Upper Left Lateral Incisor', shortName: 'UL2', quadrant: 'Upper Left (Q2)', quadrantNumber: 2, arch: 'upper', side: 'left', type: 'incisor', approxAngle: -0.28 },
  23: { fdi: 23, name: 'Upper Left Canine', shortName: 'UL3', quadrant: 'Upper Left (Q2)', quadrantNumber: 2, arch: 'upper', side: 'left', type: 'canine', approxAngle: -0.50 },
  24: { fdi: 24, name: 'Upper Left First Premolar', shortName: 'UL4', quadrant: 'Upper Left (Q2)', quadrantNumber: 2, arch: 'upper', side: 'left', type: 'premolar', approxAngle: -0.72 },
  25: { fdi: 25, name: 'Upper Left Second Premolar', shortName: 'UL5', quadrant: 'Upper Left (Q2)', quadrantNumber: 2, arch: 'upper', side: 'left', type: 'premolar', approxAngle: -0.94 },
  26: { fdi: 26, name: 'Upper Left First Molar', shortName: 'UL6', quadrant: 'Upper Left (Q2)', quadrantNumber: 2, arch: 'upper', side: 'left', type: 'molar', approxAngle: -1.18 },
  27: { fdi: 27, name: 'Upper Left Second Molar', shortName: 'UL7', quadrant: 'Upper Left (Q2)', quadrantNumber: 2, arch: 'upper', side: 'left', type: 'molar', approxAngle: -1.42 },

  // Mandibular / Lower Left (Quadrant 3)
  31: { fdi: 31, name: 'Lower Left Central Incisor', shortName: 'LL1', quadrant: 'Lower Left (Q3)', quadrantNumber: 3, arch: 'lower', side: 'left', type: 'incisor', approxAngle: -0.09 },
  32: { fdi: 32, name: 'Lower Left Lateral Incisor', shortName: 'LL2', quadrant: 'Lower Left (Q3)', quadrantNumber: 3, arch: 'lower', side: 'left', type: 'incisor', approxAngle: -0.26 },
  33: { fdi: 33, name: 'Lower Left Canine', shortName: 'LL3', quadrant: 'Lower Left (Q3)', quadrantNumber: 3, arch: 'lower', side: 'left', type: 'canine', approxAngle: -0.48 },
  34: { fdi: 34, name: 'Lower Left First Premolar', shortName: 'LL4', quadrant: 'Lower Left (Q3)', quadrantNumber: 3, arch: 'lower', side: 'left', type: 'premolar', approxAngle: -0.70 },
  35: { fdi: 35, name: 'Lower Left Second Premolar', shortName: 'LL5', quadrant: 'Lower Left (Q3)', quadrantNumber: 3, arch: 'lower', side: 'left', type: 'premolar', approxAngle: -0.92 },
  36: { fdi: 36, name: 'Lower Left First Molar', shortName: 'LL6', quadrant: 'Lower Left (Q3)', quadrantNumber: 3, arch: 'lower', side: 'left', type: 'molar', approxAngle: -1.16 },
  37: { fdi: 37, name: 'Lower Left Second Molar', shortName: 'LL7', quadrant: 'Lower Left (Q3)', quadrantNumber: 3, arch: 'lower', side: 'left', type: 'molar', approxAngle: -1.40 },

  // Mandibular / Lower Right (Quadrant 4)
  41: { fdi: 41, name: 'Lower Right Central Incisor', shortName: 'LR1', quadrant: 'Lower Right (Q4)', quadrantNumber: 4, arch: 'lower', side: 'right', type: 'incisor', approxAngle: 0.09 },
  42: { fdi: 42, name: 'Lower Right Lateral Incisor', shortName: 'LR2', quadrant: 'Lower Right (Q4)', quadrantNumber: 4, arch: 'lower', side: 'right', type: 'incisor', approxAngle: 0.26 },
  43: { fdi: 43, name: 'Lower Right Canine', shortName: 'LR3', quadrant: 'Lower Right (Q4)', quadrantNumber: 4, arch: 'lower', side: 'right', type: 'canine', approxAngle: 0.48 },
  44: { fdi: 44, name: 'Lower Right First Premolar', shortName: 'LR4', quadrant: 'Lower Right (Q4)', quadrantNumber: 4, arch: 'lower', side: 'right', type: 'premolar', approxAngle: 0.70 },
  45: { fdi: 45, name: 'Lower Right Second Premolar', shortName: 'LR5', quadrant: 'Lower Right (Q4)', quadrantNumber: 4, arch: 'lower', side: 'right', type: 'premolar', approxAngle: 0.92 },
  46: { fdi: 46, name: 'Lower Right First Molar', shortName: 'LR6', quadrant: 'Lower Right (Q4)', quadrantNumber: 4, arch: 'lower', side: 'right', type: 'molar', approxAngle: 1.16 },
  47: { fdi: 47, name: 'Lower Right Second Molar', shortName: 'LR7', quadrant: 'Lower Right (Q4)', quadrantNumber: 4, arch: 'lower', side: 'right', type: 'molar', approxAngle: 1.40 },
};

/**
 * Identifies the closest FDI tooth based on 3D hit point coordinates along the dental arch
 */
export function getFDIToothFromPoint(point: THREE.Vector3, arch: 'upper' | 'lower'): FDIToothInfo {
  // In dental view: X is transverse (-X = patient left, +X = patient right)
  // Z is sagittal (+Z = anterior incisors, -Z = posterior molars)
  const angle = Math.atan2(point.x, Math.max(0.001, point.z));
  
  const isUpper = arch === 'upper';
  const targetQuadrant = isUpper 
    ? (point.x >= 0 ? 1 : 2)
    : (point.x >= 0 ? 4 : 3);

  const candidateTeeth = Object.values(FDI_TEETH_MAP).filter(
    t => t.quadrantNumber === targetQuadrant
  );

  let closestTooth = candidateTeeth[0];
  let minDiff = Infinity;

  for (const tooth of candidateTeeth) {
    const diff = Math.abs(angle - tooth.approxAngle);
    if (diff < minDiff) {
      minDiff = diff;
      closestTooth = tooth;
    }
  }

  return closestTooth;
}

/**
 * Returns FDI tooth info by FDI number (e.g., 11..48), or null if gingiva (0)
 */
export function getFDIToothByID(fdi: number): FDIToothInfo | null {
  return FDI_TEETH_MAP[fdi] || null;
}

