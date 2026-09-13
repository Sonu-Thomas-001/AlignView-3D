import * as THREE from 'three';
import {
  MeshBVH,
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh';

/**
 * One bounding volume hierarchy per geometry, shared by everything that needs one.
 *
 * Two separate jobs in this app query the same meshes: picking, which fires on every
 * pointer move across the viewport, and displacement measurement, which asks for the
 * nearest point on a neighbouring stage's surface. Both are linear scans over a few
 * hundred thousand triangles without an acceleration structure, and building one each
 * would double the cost and the memory for no gain, so they share `geometry.boundsTree`.
 *
 * Importing this module installs the three.js prototype patches. `acceleratedRaycast`
 * falls back to the built-in behaviour on a geometry with no tree, so installing it is
 * safe for meshes that never get one, and picking is only fast on the ones that do.
 */
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

/**
 * Small leaves make closest-point queries faster at the cost of a deeper tree. Chosen for
 * the measurement path, which is the expensive one: picking is a single ray per event
 * while a displacement pass is one query per vertex.
 */
const BVH_OPTIONS = { maxLeafTris: 12 };

/**
 * How many geometries keep a tree at once.
 *
 * A tree for a full arch runs to a few megabytes, and a case is 30-plus stages held in
 * memory together, so keeping one for every stage would cost more than the meshes do.
 * Eviction is by least recent use, which keeps the stage being measured against alive
 * without special-casing it: every measurement touches it, so it never ages out.
 */
const MAX_TREES = 8;

/** Insertion order is access order: re-inserting on a hit moves a geometry to the end. */
const tracked = new Set<THREE.BufferGeometry>();

/**
 * The geometry's bounding volume hierarchy, built on first use.
 *
 * Must not be called before `segmentToothAndGum`, which reorders triangles in place and
 * would leave the tree pointing at the wrong ones. Segmentation drops any existing tree
 * for exactly that reason, so the order is enforced rather than merely documented.
 */
export function ensureBoundsTree(geometry: THREE.BufferGeometry): MeshBVH {
  if (geometry.boundsTree) {
    // Refresh its position in the eviction order.
    tracked.delete(geometry);
    tracked.add(geometry);
    return geometry.boundsTree;
  }

  while (tracked.size >= MAX_TREES) {
    const oldest = tracked.values().next().value;
    if (!oldest) break;
    tracked.delete(oldest);
    oldest.disposeBoundsTree();
  }

  const tree = geometry.computeBoundsTree(BVH_OPTIONS);
  tracked.add(geometry);
  return tree;
}

/** Drops every tree. Call when the loaded case is replaced. */
export function disposeAllBoundsTrees(): void {
  for (const geometry of tracked) geometry.disposeBoundsTree();
  tracked.clear();
}

/** Drops one geometry's tree, if it has one. */
export function disposeBoundsTreeFor(geometry: THREE.BufferGeometry | undefined): void {
  if (!geometry?.boundsTree) return;
  tracked.delete(geometry);
  geometry.disposeBoundsTree();
}
