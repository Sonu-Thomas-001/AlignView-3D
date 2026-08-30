export type ViewMode = 'both' | 'upper' | 'lower' | 'split';
export type RenderMode = 'shaded' | 'wireframe' | 'solid' | 'xray';
export type ActiveTool = 'move' | 'rotate' | 'zoom' | 'pan' | 'measure' | 'section';

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
  customBufferGeometry?: any;
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
