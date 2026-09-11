import type { BufferGeometry } from 'three';

export type ViewMode = 'both' | 'upper' | 'lower' | 'split';
export type RenderMode = 'shaded' | 'wireframe' | 'solid' | 'xray';
export type ActiveTool = 'move' | 'rotate' | 'zoom' | 'pan' | 'measure' | 'section';

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface STLFileInfo {
  id: string;
  name: string;
  arch: 'upper' | 'lower';
  stage: number;
  date: string;
  fileSize: string;
  verticesCount: number;
  trianglesCount: number;
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  isTemplate?: boolean;
  customUrl?: string;
  customBufferGeometry?: BufferGeometry;
  // Raw (pre-normalization) arch centroid & principal axis, used to derive real
  // inter-stage movement estimates since normalizeDentalGeometry re-centers each
  // stage independently for rendering, discarding absolute position.
  centroid?: Vec3Tuple;
  principalAxis?: Vec3Tuple;
}

export interface MeasurementPoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface Measurement {
  p1: MeasurementPoint;
  p2: MeasurementPoint;
  distanceMm: number;
}
