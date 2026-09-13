import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import {
  computeDentalNormalization,
  applyDentalNormalization,
  computeGeometryPose,
} from './stlParser';
import { segmentToothAndGum, type ToothGumSplit } from './toothGumSegmentation';

/**
 * Everything an arch stage needs before it can be shown, in one pure function.
 *
 * Parsing an STL, deriving the arch frame, placing the mesh into it and splitting crown
 * from gingiva together take most of a second per stage on a real case, and a case is
 * thirty-plus stages. Run on the main thread that is thirty seconds of a frozen tab with
 * a progress bar that cannot repaint, which is exactly the moment a provider decides the
 * product is broken.
 *
 * So the work lives here, free of DOM and React, and both callers use it unchanged: the
 * worker in `stlImport.worker.ts` and the same-thread fallback in `stlImportClient.ts`.
 * A single implementation is the point. The frame derivation and the mismatch fallback are
 * the subtlest logic in the import path, and having them exist twice, once per thread,
 * would guarantee the two drift.
 */

/** A stage's placement inputs. `frame` is null for the first stage of an arch. */
export interface StagePlacement {
  arch: 'upper' | 'lower';
  /**
   * The arch's shared frame as 16 column-major numbers, or null to derive one from this
   * stage. Passed as plain numbers rather than a `THREE.Matrix4` so it survives
   * `postMessage`.
   */
  frame: number[] | null;
  /** Bbox centre of the arch's reference stage after placement, for the mismatch check. */
  refCenter: [number, number, number] | null;
  /**
   * How far a stage's placed bbox centre may sit from the reference stage's before the
   * two are treated as being in different exported frames.
   */
  mismatchMm: number;
}

/** One vertex attribute, flattened so its buffer can be transferred between threads. */
export interface StageAttribute {
  name: string;
  array: Float32Array;
  itemSize: number;
}

export interface StageImport {
  attributes: StageAttribute[];
  index: Uint32Array | null;
  groups: { start: number; count: number; materialIndex: number }[];
  /**
   * The frame this stage was actually placed by. Equal to the input frame when one was
   * given and it fitted; a freshly derived frame when none was given; and a stage-local
   * frame when the shared one was rejected.
   */
  frame: number[];
  /** Bbox centre after placement. The caller records this for the reference stage. */
  center: [number, number, number];
  frameShiftMm: number;
  usesSharedFrame: boolean;
  /** Pose of the mesh as it arrived, before any placement. */
  centroid: [number, number, number];
  principalAxis: [number, number, number];
  size: [number, number, number];
  verticesCount: number;
  trianglesCount: number;
  split: ToothGumSplit | null;
}

/**
 * STL vertex data is always Float32. Anything else means a loader change, and silently
 * narrowing it would corrupt the mesh rather than fail, so it throws instead.
 */
function floatArrayOf(attribute: THREE.BufferAttribute, name: string): Float32Array {
  const { array } = attribute;
  if (array instanceof Float32Array) return array;
  throw new Error(`Attribute "${name}" is ${array.constructor.name}, expected Float32Array`);
}

/** Parses, places and segments one arch stage. Consumes `buffer`; does not retain it. */
export function importArchStage(buffer: ArrayBuffer, placement: StagePlacement): StageImport {
  const { arch, mismatchMm } = placement;

  const geometry = new STLLoader().parse(buffer);
  const rawPose = computeGeometryPose(geometry);

  const center = new THREE.Vector3();
  let usesSharedFrame = true;
  let frameShiftMm = 0;
  let appliedFrame: THREE.Matrix4;

  if (!placement.frame) {
    appliedFrame = computeDentalNormalization(geometry, arch);
    applyDentalNormalization(geometry, appliedFrame);
    geometry.boundingBox!.getCenter(center);
  } else {
    const sharedFrame = new THREE.Matrix4().fromArray(placement.frame);
    appliedFrame = sharedFrame;
    applyDentalNormalization(geometry, sharedFrame);
    geometry.boundingBox!.getCenter(center);

    if (placement.refCenter) {
      frameShiftMm = center.distanceTo(new THREE.Vector3().fromArray(placement.refCenter));
    }

    if (frameShiftMm > mismatchMm) {
      // Undo the shared placement and fall back to a self-derived one. The stage will look
      // correct on its own but its movement readings against the rest of the sequence
      // cannot be trusted, which `usesSharedFrame` records for the UI.
      geometry.applyMatrix4(sharedFrame.clone().invert());
      appliedFrame = computeDentalNormalization(geometry, arch);
      applyDentalNormalization(geometry, appliedFrame);
      geometry.boundingBox!.getCenter(center);
      usesSharedFrame = false;
    }
  }

  // Split crown from gingiva now that the arch is placed. This has to happen before
  // anything measures or renders the geometry: it reorders triangles in place, which would
  // invalidate a bounding volume hierarchy built beforehand.
  const split = segmentToothAndGum(geometry, arch);

  const size = new THREE.Vector3();
  (geometry.boundingBox ?? new THREE.Box3()).getSize(size);

  const attributes: StageAttribute[] = Object.entries(geometry.attributes).map(
    ([name, attribute]) => {
      const bufferAttribute = attribute as THREE.BufferAttribute;
      return {
        name,
        array: floatArrayOf(bufferAttribute, name),
        itemSize: bufferAttribute.itemSize,
      };
    },
  );

  const index = geometry.index ? new Uint32Array(geometry.index.array) : null;
  const vertexCount = geometry.attributes.position.count;

  return {
    attributes,
    index,
    groups: geometry.groups.map(g => ({
      start: g.start,
      count: g.count,
      materialIndex: g.materialIndex ?? 0,
    })),
    frame: appliedFrame.toArray(),
    center: [center.x, center.y, center.z],
    frameShiftMm,
    usesSharedFrame,
    centroid: [rawPose.centroid.x, rawPose.centroid.y, rawPose.centroid.z],
    principalAxis: [rawPose.principalAxis.x, rawPose.principalAxis.y, rawPose.principalAxis.z],
    size: [size.x, size.y, size.z],
    verticesCount: vertexCount,
    trianglesCount: Math.round((index ? index.length : vertexCount) / 3),
    split,
  };
}

/**
 * The buffers to hand to `postMessage`'s transfer list.
 *
 * Without this the structured clone copies every array, which for a full case is hundreds
 * of megabytes of pointless duplication and a second thread's worth of garbage. With it
 * the buffers move, and the worker's copy is detached.
 */
export function transferablesOf(result: StageImport): ArrayBuffer[] {
  const buffers = result.attributes.map(a => a.array.buffer as ArrayBuffer);
  if (result.index) buffers.push(result.index.buffer as ArrayBuffer);
  return buffers;
}

/**
 * Rebuilds a renderable geometry from a worker result.
 *
 * The split is written back onto `userData` under the key `segmentToothAndGum` caches
 * against, so the render path finds it already done rather than spending another second
 * per stage recomputing it on the main thread.
 */
export function geometryFromImport(result: StageImport): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  for (const { name, array, itemSize } of result.attributes) {
    geometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  }
  if (result.index) geometry.setIndex(new THREE.BufferAttribute(result.index, 1));

  for (const g of result.groups) geometry.addGroup(g.start, g.count, g.materialIndex);

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  if (result.split) geometry.userData.toothGumSplit = result.split;

  return geometry;
}
