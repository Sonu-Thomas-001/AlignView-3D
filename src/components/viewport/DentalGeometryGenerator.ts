import * as THREE from 'three';

export interface ToothData {
  id: number;
  name: string;
  arch: 'upper' | 'lower';
  archIndex: number; // 0 (far right molar) to 13 (far left molar), 6 & 7 are central incisors
  width: number;
  height: number;
  depth: number;
  type: 'central' | 'lateral' | 'canine' | 'premolar' | 'molar';
  initialRotation: number;
  initialOffsetX: number;
  initialOffsetZ: number;
  initialOffsetY: number;
}

// 14 Upper teeth in anatomical order from Right to Left
export const UPPER_TEETH: ToothData[] = [
  { id: 1, name: 'Upper R Molar 2', arch: 'upper', archIndex: 0, width: 8.6, height: 7.0, depth: 8.8, type: 'molar', initialRotation: 0.08, initialOffsetX: 0.4, initialOffsetZ: -0.3, initialOffsetY: 0.1 },
  { id: 2, name: 'Upper R Molar 1', arch: 'upper', archIndex: 1, width: 9.0, height: 7.2, depth: 9.0, type: 'molar', initialRotation: -0.06, initialOffsetX: -0.3, initialOffsetZ: 0.2, initialOffsetY: -0.1 },
  { id: 3, name: 'Upper R Premolar 2', arch: 'upper', archIndex: 2, width: 7.0, height: 7.6, depth: 7.6, type: 'premolar', initialRotation: 0.09, initialOffsetX: 0.3, initialOffsetZ: -0.2, initialOffsetY: 0.1 },
  { id: 4, name: 'Upper R Premolar 1', arch: 'upper', archIndex: 3, width: 6.8, height: 7.8, depth: 7.4, type: 'premolar', initialRotation: -0.07, initialOffsetX: -0.2, initialOffsetZ: 0.2, initialOffsetY: -0.1 },
  { id: 5, name: 'Upper R Canine', arch: 'upper', archIndex: 4, width: 7.4, height: 9.4, depth: 7.0, type: 'canine', initialRotation: 0.14, initialOffsetX: 0.5, initialOffsetZ: 0.3, initialOffsetY: 0.2 },
  { id: 6, name: 'Upper R Lateral Incisor', arch: 'upper', archIndex: 5, width: 6.6, height: 8.8, depth: 4.8, type: 'lateral', initialRotation: -0.12, initialOffsetX: -0.4, initialOffsetZ: -0.4, initialOffsetY: -0.2 },
  { id: 7, name: 'Upper R Central Incisor', arch: 'upper', archIndex: 6, width: 8.8, height: 10.2, depth: 4.8, type: 'central', initialRotation: 0.16, initialOffsetX: 0.6, initialOffsetZ: 0.7, initialOffsetY: 0.3 },
  // Left side
  { id: 8, name: 'Upper L Central Incisor', arch: 'upper', archIndex: 7, width: 8.8, height: 10.2, depth: 4.8, type: 'central', initialRotation: -0.14, initialOffsetX: -0.5, initialOffsetZ: 0.6, initialOffsetY: 0.3 },
  { id: 9, name: 'Upper L Lateral Incisor', arch: 'upper', archIndex: 8, width: 6.6, height: 8.8, depth: 4.8, type: 'lateral', initialRotation: 0.11, initialOffsetX: 0.3, initialOffsetZ: -0.3, initialOffsetY: -0.2 },
  { id: 10, name: 'Upper L Canine', arch: 'upper', archIndex: 9, width: 7.4, height: 9.4, depth: 7.0, type: 'canine', initialRotation: -0.13, initialOffsetX: -0.4, initialOffsetZ: 0.2, initialOffsetY: 0.2 },
  { id: 11, name: 'Upper L Premolar 1', arch: 'upper', archIndex: 10, width: 6.8, height: 7.8, depth: 7.4, type: 'premolar', initialRotation: 0.08, initialOffsetX: 0.2, initialOffsetZ: -0.2, initialOffsetY: -0.1 },
  { id: 12, name: 'Upper L Premolar 2', arch: 'upper', archIndex: 11, width: 7.0, height: 7.6, depth: 7.6, type: 'premolar', initialRotation: -0.09, initialOffsetX: -0.3, initialOffsetZ: 0.2, initialOffsetY: 0.1 },
  { id: 13, name: 'Upper L Molar 1', arch: 'upper', archIndex: 12, width: 9.0, height: 7.2, depth: 9.0, type: 'molar', initialRotation: 0.06, initialOffsetX: 0.2, initialOffsetZ: -0.2, initialOffsetY: -0.1 },
  { id: 14, name: 'Upper L Molar 2', arch: 'upper', archIndex: 13, width: 8.6, height: 7.0, depth: 8.8, type: 'molar', initialRotation: -0.08, initialOffsetX: -0.3, initialOffsetZ: 0.2, initialOffsetY: 0.1 },
];

// 14 Lower teeth in anatomical order from Right to Left
export const LOWER_TEETH: ToothData[] = [
  { id: 15, name: 'Lower R Molar 2', arch: 'lower', archIndex: 0, width: 8.2, height: 6.6, depth: 8.4, type: 'molar', initialRotation: 0.06, initialOffsetX: 0.3, initialOffsetZ: -0.2, initialOffsetY: -0.1 },
  { id: 16, name: 'Lower R Molar 1', arch: 'lower', archIndex: 1, width: 8.6, height: 6.8, depth: 8.6, type: 'molar', initialRotation: -0.05, initialOffsetX: -0.2, initialOffsetZ: 0.2, initialOffsetY: 0.1 },
  { id: 17, name: 'Lower R Premolar 2', arch: 'lower', archIndex: 2, width: 6.6, height: 7.0, depth: 7.0, type: 'premolar', initialRotation: 0.08, initialOffsetX: 0.2, initialOffsetZ: -0.2, initialOffsetY: -0.1 },
  { id: 18, name: 'Lower R Premolar 1', arch: 'lower', archIndex: 3, width: 6.4, height: 7.2, depth: 6.8, type: 'premolar', initialRotation: -0.06, initialOffsetX: -0.2, initialOffsetZ: 0.2, initialOffsetY: 0.1 },
  { id: 19, name: 'Lower R Canine', arch: 'lower', archIndex: 4, width: 6.8, height: 8.8, depth: 6.6, type: 'canine', initialRotation: 0.12, initialOffsetX: 0.3, initialOffsetZ: 0.2, initialOffsetY: -0.2 },
  { id: 20, name: 'Lower R Lateral Incisor', arch: 'lower', archIndex: 5, width: 5.6, height: 8.2, depth: 4.2, type: 'lateral', initialRotation: -0.10, initialOffsetX: -0.3, initialOffsetZ: -0.3, initialOffsetY: 0.2 },
  { id: 21, name: 'Lower R Central Incisor', arch: 'lower', archIndex: 6, width: 5.4, height: 8.4, depth: 4.0, type: 'central', initialRotation: 0.13, initialOffsetX: 0.4, initialOffsetZ: 0.5, initialOffsetY: -0.2 },
  // Left side
  { id: 22, name: 'Lower L Central Incisor', arch: 'lower', archIndex: 7, width: 5.4, height: 8.4, depth: 4.0, type: 'central', initialRotation: -0.12, initialOffsetX: -0.4, initialOffsetZ: 0.4, initialOffsetY: -0.2 },
  { id: 23, name: 'Lower L Lateral Incisor', arch: 'lower', archIndex: 8, width: 5.6, height: 8.2, depth: 4.2, type: 'lateral', initialRotation: 0.09, initialOffsetX: 0.2, initialOffsetZ: -0.2, initialOffsetY: 0.2 },
  { id: 24, name: 'Lower L Canine', arch: 'lower', archIndex: 9, width: 6.8, height: 8.8, depth: 6.6, type: 'canine', initialRotation: -0.11, initialOffsetX: -0.3, initialOffsetZ: 0.2, initialOffsetY: -0.2 },
  { id: 25, name: 'Lower L Premolar 1', arch: 'lower', archIndex: 10, width: 6.4, height: 7.2, depth: 6.8, type: 'premolar', initialRotation: 0.07, initialOffsetX: 0.2, initialOffsetZ: -0.2, initialOffsetY: 0.1 },
  { id: 26, name: 'Lower L Premolar 2', arch: 'lower', archIndex: 11, width: 6.6, height: 7.0, depth: 7.0, type: 'premolar', initialRotation: -0.08, initialOffsetX: -0.2, initialOffsetZ: 0.2, initialOffsetY: -0.1 },
  { id: 27, name: 'Lower L Molar 1', arch: 'lower', archIndex: 12, width: 8.6, height: 6.8, depth: 8.6, type: 'molar', initialRotation: 0.05, initialOffsetX: 0.2, initialOffsetZ: -0.2, initialOffsetY: 0.1 },
  { id: 28, name: 'Lower L Molar 2', arch: 'lower', archIndex: 13, width: 8.2, height: 6.6, depth: 8.4, type: 'molar', initialRotation: -0.06, initialOffsetX: -0.2, initialOffsetZ: 0.2, initialOffsetY: -0.1 },
];

/**
 * Creates smooth organic anatomical tooth crown geometry
 */
export function createToothGeometry(tooth: ToothData): THREE.BufferGeometry {
  const isUpper = tooth.arch === 'upper';
  let geom: THREE.BufferGeometry;

  if (tooth.type === 'central' || tooth.type === 'lateral') {
    // Incisors: Chisel-like crown, smooth convex facial surface, tapered cervical neck
    const segsX = 28;
    const segsY = 28;
    const segsZ = 18;
    geom = new THREE.BoxGeometry(tooth.width, tooth.height, tooth.depth, segsX, segsY, segsZ);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Normalized Y from 0 (root/cervical margin) to 1 (incisal cutting edge)
      const ny = isUpper 
        ? (tooth.height / 2 - y) / tooth.height 
        : (y + tooth.height / 2) / tooth.height;

      // 1. Cervical neck taper (narrow near gums)
      const cervicalFactor = 0.84 + Math.min(1, ny * 1.6) * 0.16;
      x *= cervicalFactor;

      // 2. Incisal edge thinning
      if (ny > 0.65) {
        const edgeTaper = 1.0 - (ny - 0.65) * 0.72;
        z *= Math.max(0.35, edgeTaper);
      }

      // 3. Natural convex labial curvature (front bulge)
      const bulge = Math.sin(ny * Math.PI) * (tooth.depth * 0.24);
      z += bulge;

      // 4. Rounded incisal bevels
      if (ny > 0.88) {
        const cornerDist = Math.abs(x) / (tooth.width * 0.5);
        if (cornerDist > 0.6) {
          const cornerBevel = Math.pow(cornerDist - 0.6, 2) * 1.0;
          if (isUpper) {
            y += cornerBevel;
          } else {
            y -= cornerBevel;
          }
        }
      }

      pos.setXYZ(i, x, y, z);
    }
  } else if (tooth.type === 'canine') {
    // Canine: pointed single cusp with strong facial ridge
    const segsR = 30;
    const segsH = 26;
    geom = new THREE.CylinderGeometry(tooth.width * 0.28, tooth.width * 0.52, tooth.height, segsR, segsH);
    geom.scale(1, 1, tooth.depth / tooth.width);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const ny = isUpper 
        ? (tooth.height / 2 - y) / tooth.height 
        : (y + tooth.height / 2) / tooth.height;

      // Cusp apex
      if (ny > 0.78) {
        const cuspElev = (1 - Math.abs(x) / (tooth.width * 0.45)) * 1.1;
        if (isUpper) {
          y -= cuspElev;
        } else {
          y += cuspElev;
        }
      }

      // Facial ridge
      z += Math.max(0, Math.cos(Math.atan2(x, z))) * 0.55;
      pos.setXYZ(i, x, y, z);
    }
  } else if (tooth.type === 'premolar') {
    // Premolar / Bicuspid: Two rounded cusps (buccal & lingual)
    geom = new THREE.CylinderGeometry(tooth.width * 0.46, tooth.width * 0.50, tooth.height, 30, 22);
    geom.scale(1, 1, tooth.depth / tooth.width);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const ny = isUpper 
        ? (tooth.height / 2 - y) / tooth.height 
        : (y + tooth.height / 2) / tooth.height;

      if (ny > 0.72) {
        // Dual cusps
        const cusp = Math.sin((z / tooth.depth) * Math.PI * 2) * 0.65;
        if (isUpper) {
          y -= cusp;
        } else {
          y += cusp;
        }
      }
      pos.setXYZ(i, x, y, z);
    }
  } else {
    // Molar: 4 distinct rounded occlusal cusps
    geom = new THREE.BoxGeometry(tooth.width, tooth.height, tooth.depth, 26, 22, 26);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const ny = isUpper 
        ? (tooth.height / 2 - y) / tooth.height 
        : (y + tooth.height / 2) / tooth.height;

      // Smooth rounded perimeter
      const r = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);
      const maxR = (tooth.width * 0.48);
      if (r > maxR) {
        x = Math.cos(angle) * maxR;
        z = Math.sin(angle) * maxR;
      }

      // 4 Cusps on occlusal surface
      if (ny > 0.68) {
        const cuspX = Math.sin((x / tooth.width) * Math.PI);
        const cuspZ = Math.sin((z / tooth.depth) * Math.PI);
        const cuspVal = Math.abs(cuspX * cuspZ) * 0.85;
        if (isUpper) {
          y -= cuspVal;
        } else {
          y += cuspVal;
        }
      }

      // Cervical constriction near gumline
      if (ny < 0.25) {
        x *= 0.91;
        z *= 0.91;
      }

      pos.setXYZ(i, x, y, z);
    }
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Calculates anatomical arch position and rotation for each tooth.
 * Front incisors face forward (+Z towards viewer), molars curve back towards -Z.
 */
export function getToothTransform(tooth: ToothData, stage: number, totalStages: number = 32) {
  const isUpper = tooth.arch === 'upper';
  const progress = Math.min(1, Math.max(0, (stage - 1) / (totalStages - 1)));
  const crowdFactor = 1.0 - progress;

  // Normalized arch parameter u from -1 (Right Molar 2) to +1 (Left Molar 2)
  const u = ((tooth.archIndex - 6.5) / 6.5);

  // Anatomical parabolic dental arch dimensions (mm)
  const archWidth = isUpper ? 28.0 : 26.5;
  const archDepth = isUpper ? 33.5 : 32.0;

  const idealX = archWidth * Math.sin(u * 1.25);
  const idealZ = archDepth * Math.cos(u * 1.25) - (archDepth * 0.52);

  // Natural occlusion alignment: upper and lower teeth meet closely
  const baseY = isUpper ? 3.8 : -3.8;
  const posY = baseY + (tooth.initialOffsetY * crowdFactor);

  const posX = idealX + (tooth.initialOffsetX * crowdFactor);
  const posZ = idealZ + (tooth.initialOffsetZ * crowdFactor);

  const tangentY = u * 1.25;
  const rotY = tangentY + (tooth.initialRotation * crowdFactor);

  const isAnterior = tooth.type === 'central' || tooth.type === 'lateral' || tooth.type === 'canine';
  const rotX = (isAnterior ? (isUpper ? -0.16 : 0.16) : (isUpper ? 0.08 : -0.08));
  const rotZ = -u * (isUpper ? 0.07 : -0.07);

  return {
    position: new THREE.Vector3(posX, posY, posZ),
    rotation: new THREE.Euler(rotX, rotY, rotZ),
  };
}

/**
 * Generates continuous anatomical Gingiva (Gum tissue) with natural scalloped contours
 */
export function createGingivaGeometry(arch: 'upper' | 'lower', stage: number = 8, totalStages: number = 32): THREE.BufferGeometry {
  const isUpper = arch === 'upper';
  const teeth = isUpper ? UPPER_TEETH : LOWER_TEETH;

  const splinePoints: THREE.Vector3[] = [];
  
  teeth.forEach((tooth) => {
    const transform = getToothTransform(tooth, stage, totalStages);
    const cervicalY = isUpper ? transform.position.y + 3.6 : transform.position.y - 3.6;
    splinePoints.push(new THREE.Vector3(transform.position.x, cervicalY, transform.position.z));
  });

  const curve = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal');
  
  const tubeRadius = isUpper ? 5.2 : 4.8;
  const tubeGeom = new THREE.TubeGeometry(curve, 96, tubeRadius, 30, false);

  const pos = tubeGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Natural palate vault for upper arch
    if (isUpper) {
      if (y > 5.5 && z < 4.0) {
        y += 2.6;
        z -= 1.6;
      }
      // Scalloped interdental papillae hugging tooth crowns
      if (y < 4.2) {
        const scallop = Math.sin(x * 1.5) * 0.45;
        y += scallop;
      }
    } else {
      // Lower alveolar ridge
      if (y < -5.5) {
        y -= 1.8;
      }
      if (y > -4.2) {
        const scallop = Math.sin(x * 1.5) * 0.45;
        y -= scallop;
      }
    }

    pos.setXYZ(i, x, y, z);
  }

  tubeGeom.computeVertexNormals();
  return tubeGeom;
}
