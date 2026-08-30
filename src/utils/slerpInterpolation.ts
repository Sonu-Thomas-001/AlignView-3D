import * as THREE from 'three';

/**
 * SE(3) Rigid Body Pose Interpolation with Quaternion SLERP
 * Interpolates smoothly between Stage N and Stage N+1 poses in 6D configuration space:
 * - 3D Position: Cubic Hermite / Linear Vector Lerp
 * - 3D Rotation: Quaternion Slerp (Spherical Linear Interpolation)
 */

export interface ToothPoseSE3 {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export function interpolatePoseSE3(
  start: ToothPoseSE3,
  end: ToothPoseSE3,
  t: number // [0.0, 1.0] fractional stage progress
): ToothPoseSE3 {
  const clampedT = Math.max(0, Math.min(1, t));

  // 1. Position Vector Linear Interpolation
  const pos = new THREE.Vector3().lerpVectors(start.position, end.position, clampedT);

  // 2. Quaternion Spherical Linear Interpolation (SLERP)
  const quat = new THREE.Quaternion().copy(start.quaternion).slerp(end.quaternion, clampedT);

  return {
    position: pos,
    quaternion: quat,
  };
}
