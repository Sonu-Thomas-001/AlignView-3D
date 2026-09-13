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
  // Raw (pre-normalization) arch centroid & principal axis of the imported mesh,
  // retained for provenance and for sanity-checking the import.
  centroid?: Vec3Tuple;
  principalAxis?: Vec3Tuple;
  /**
   * True when this stage was placed by its arch's shared reference transform, which
   * is what makes its position directly comparable with the other stages. False
   * means the exporter wrote this file in its own coordinate frame, so it had to be
   * placed on its own and its movement readings are not meaningful.
   */
  usesSharedFrame?: boolean;
  /** Distance (mm) from the reference stage's bounding-box centre after placement. */
  frameShiftMm?: number;
  /**
   * Crown / gingiva split found by `segmentToothAndGum`, kept for provenance: it is what
   * decides where the tooth colour stops and the gum colour starts, so a case that looks
   * wrong can be checked without re-running the estimator.
   */
  toothTriangles?: number;
  gumTriangles?: number;
  /** Mean depth (mm) of the estimated gingival margin below the occlusal surface. */
  gingivalMarginMm?: number;
  /** Fraction of angular bins where the margin was measured rather than interpolated. */
  marginDetectedFraction?: number;
}

export interface HoveredTooth {
  fdi: number;
  name: string;
  shortName: string;
  quadrant: string;
  arch: 'upper' | 'lower';
  screenX: number;
  screenY: number;
  /**
   * Hover point in the arch mesh's own coordinates, not world coordinates. The lower
   * arch is positioned and tilted into occlusion by its group, so a world-space point
   * cannot be compared against another stage's untransformed geometry.
   */
  localPoint?: Vec3Tuple;
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
