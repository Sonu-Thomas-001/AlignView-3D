import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three-stdlib';
import { useViewerStore } from '@/store/useViewerStore';
import { computeDentalNormalization, applyDentalNormalization, pickFileForStage } from '@/utils/stlParser';
import { computeOcclusionOffset } from '@/utils/occlusion';
import { segmentToothAndGum } from '@/utils/toothGumSegmentation';
import { getFDIToothFromPoint } from '@/utils/fdiToothMap';

// Global cache for loaded and normalized STL geometries
const geometryCache = new Map<string, THREE.BufferGeometry>();

/**
 * Placement transforms for URL-loaded sequences, keyed by arch sequence. Every stage
 * of one arch has to be placed by the same transform: the CAD exporter already writes
 * all stages in one shared frame with the model base fixed and only the teeth moving,
 * so deriving (and re-centring) a transform per stage would subtract the very movement
 * the viewer is meant to show. Whichever stage loads first defines the frame; a
 * constant offset shared by every stage does not affect relative tooth movement.
 */
const archFrameCache = new Map<string, THREE.Matrix4>();

/** Places a URL-loaded stage using its arch sequence's shared transform. */
function normalizeIntoArchFrame(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
  frameKey: string,
): THREE.BufferGeometry {
  let frame = archFrameCache.get(frameKey);
  if (!frame) {
    frame = computeDentalNormalization(geometry, arch);
    archFrameCache.set(frameKey, frame);
  }
  const placed = applyDentalNormalization(geometry, frame);
  segmentToothAndGum(placed, arch);
  return placed;
}

/**
 * Splits crown from gingiva if that has not happened yet.
 *
 * Uploaded geometry is split during import, so this is normally a no-op: the result is
 * memoised on the geometry. It is called anyway on every path that hands a geometry to
 * the renderer, because a mesh with no groups would draw entirely in the first material
 * and silently lose the gum colour. It has to run before anything builds a bounding
 * volume hierarchy over the geometry, since it reorders triangles in place.
 */
function ensureSegmented(
  geometry: THREE.BufferGeometry,
  arch: 'upper' | 'lower',
): THREE.BufferGeometry {
  segmentToothAndGum(geometry, arch);
  return geometry;
}

interface DentalArchModelProps {
  stage: number;
  totalStages?: number;
  clippingPlane?: THREE.Plane | null;
  onPointClick?: (point: THREE.Vector3) => void;
  /**
   * Resolve the displayed mesh from the `stage` prop instead of the sidebar
   * selection. Split view uses this so its two panes can show two different
   * stages of the same case simultaneously.
   */
  resolveByStage?: boolean;
}

export const DentalArchModel: React.FC<DentalArchModelProps> = ({
  stage,
  totalStages = 32,
  clippingPlane = null,
  onPointClick,
  resolveByStage = false,
}) => {
  const {
    viewMode,
    renderMode,
    activeTool,
    upperFiles,
    lowerFiles,
    selectedUpperId,
    selectedLowerId,
    setHoveredTooth,
    toothColor,
    gumColor,
    tintGums,
  } = useViewerStore();

  const groupRef = useRef<THREE.Group>(null);
  const [activeUpperGeom, setActiveUpperGeom] = useState<THREE.BufferGeometry | null>(null);
  const [activeLowerGeom, setActiveLowerGeom] = useState<THREE.BufferGeometry | null>(null);

  // Active files. In split view each pane resolves its own stage from geometry, so the
  // "Initial" pane keeps showing stage 1 while the sidebar selection drives the other.
  const selectedUpperFile = useMemo(
    () => (resolveByStage
      ? pickFileForStage(upperFiles, stage)
      : upperFiles.find(f => f.id === selectedUpperId) || upperFiles[0]),
    [resolveByStage, stage, upperFiles, selectedUpperId],
  );
  const selectedLowerFile = useMemo(
    () => (resolveByStage
      ? pickFileForStage(lowerFiles, stage)
      : lowerFiles.find(f => f.id === selectedLowerId) || lowerFiles[0]),
    [resolveByStage, stage, lowerFiles, selectedLowerId],
  );

  // One frame per arch sequence. Keyed off the earliest stage's id so re-importing a
  // different case does not reuse the previous case's placement.
  const upperFrameKey = useMemo(
    () => `upper:${pickFileForStage(upperFiles, 1)?.id ?? 'none'}`,
    [upperFiles],
  );
  const lowerFrameKey = useMemo(
    () => `lower:${pickFileForStage(lowerFiles, 1)?.id ?? 'none'}`,
    [lowerFiles],
  );

  // Load and cache Upper STL geometry
  useEffect(() => {
    if (!selectedUpperFile) {
      setActiveUpperGeom(null);
      return;
    }

    // 1. If buffer geometry was already parsed in memory from file upload
    if (selectedUpperFile.customBufferGeometry) {
      setActiveUpperGeom(ensureSegmented(selectedUpperFile.customBufferGeometry, 'upper'));
      return;
    }

    // 2. Otherwise load via customUrl if present
    const url = selectedUpperFile.customUrl;
    if (!url) return;

    if (geometryCache.has(url)) {
      const cached = ensureSegmented(geometryCache.get(url)!, 'upper');
      setActiveUpperGeom(cached);
      selectedUpperFile.customBufferGeometry = cached;
      return;
    }

    let cancelled = false;
    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        if (cancelled) return;
        const normalized = normalizeIntoArchFrame(geometry, 'upper', upperFrameKey);
        geometryCache.set(url, normalized);
        selectedUpperFile.customBufferGeometry = normalized;
        setActiveUpperGeom(normalized);
      },
      undefined,
      (err) => console.warn('Error loading Upper STL:', err)
    );

    return () => {
      cancelled = true;
    };
  }, [selectedUpperFile, selectedUpperFile?.customBufferGeometry, upperFrameKey]);

  // Load and cache Lower STL geometry
  useEffect(() => {
    if (!selectedLowerFile) {
      setActiveLowerGeom(null);
      return;
    }

    // 1. If buffer geometry was already parsed in memory from file upload
    if (selectedLowerFile.customBufferGeometry) {
      setActiveLowerGeom(ensureSegmented(selectedLowerFile.customBufferGeometry, 'lower'));
      return;
    }

    // 2. Otherwise load via customUrl if present
    const url = selectedLowerFile.customUrl;
    if (!url) return;

    if (geometryCache.has(url)) {
      const cached = ensureSegmented(geometryCache.get(url)!, 'lower');
      setActiveLowerGeom(cached);
      selectedLowerFile.customBufferGeometry = cached;
      return;
    }

    let cancelled = false;
    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        if (cancelled) return;
        const normalized = normalizeIntoArchFrame(geometry, 'lower', lowerFrameKey);
        geometryCache.set(url, normalized);
        selectedLowerFile.customBufferGeometry = normalized;
        setActiveLowerGeom(normalized);
      },
      undefined,
      (err) => console.warn('Error loading Lower STL:', err)
    );

    return () => {
      cancelled = true;
    };
  }, [selectedLowerFile, selectedLowerFile?.customBufferGeometry, lowerFrameKey]);

  // Handle FDI Tooth Hover Tooltip via 3D spatial dental mapping
  const handlePointerMove = (e: ThreeEvent<PointerEvent>, arch: 'upper' | 'lower') => {
    if (activeTool === 'measure') return;
    e.stopPropagation();

    if (e.point) {
      const tooth = getFDIToothFromPoint(e.point, arch);
      // The lower arch group is translated and tilted into occlusion, so the world-space
      // hit point has to be pulled back into mesh coordinates before it can be compared
      // against another stage's geometry.
      const local = e.object.worldToLocal(e.point.clone());
      setHoveredTooth({
        ...tooth,
        screenX: e.clientX,
        screenY: e.clientY,
        localPoint: { x: local.x, y: local.y, z: local.z },
      });
    }
  };

  const handlePointerOut = () => {
    setHoveredTooth(null);
  };

  // Split view shows the full bite in both panes so the two stages are directly
  // comparable; only the explicit Upper-only / Lower-only modes hide an arch.
  const showUpper = viewMode !== 'lower';
  const showLower = viewMode !== 'upper';

  const hasUpper = upperFiles.length > 0;
  const hasLower = lowerFiles.length > 0;

  // Material selection based on render mode & user custom color
  const clippingPlanesArray = useMemo(() => (clippingPlane ? [clippingPlane] : []), [clippingPlane]);

  /**
   * Two materials per arch, in the order `segmentToothAndGum` writes the geometry's
   * groups: crown first, gingiva second. Enamel and soft tissue do not respond to light
   * the same way, so a single material makes one of them look wrong - enamel needs a
   * hard specular clearcoat, mucosa is matte with a wide diffuse sheen.
   */
  const archMaterials = useMemo(() => {
    const enamelHex = toothColor || '#FFFFFF';
    const gingivaHex = tintGums ? gumColor || '#D98E96' : enamelHex;

    if (renderMode === 'wireframe') {
      return [
        new THREE.MeshBasicMaterial({
          color: '#38BDF8',
          wireframe: true,
          clippingPlanes: clippingPlanesArray,
        }),
        new THREE.MeshBasicMaterial({
          color: tintGums ? '#F472B6' : '#38BDF8',
          wireframe: true,
          clippingPlanes: clippingPlanesArray,
        }),
      ];
    }

    if (renderMode === 'solid') {
      return [
        new THREE.MeshLambertMaterial({
          color: enamelHex,
          clippingPlanes: clippingPlanesArray,
        }),
        new THREE.MeshLambertMaterial({
          color: gingivaHex,
          clippingPlanes: clippingPlanesArray,
        }),
      ];
    }

    if (renderMode === 'xray') {
      // Both surfaces stay translucent; the gum is pushed further back so the roots and
      // crown outlines a clinician is looking for in this mode stay legible through it.
      return [
        new THREE.MeshPhysicalMaterial({
          color: '#93C5FD',
          transparent: true,
          opacity: 0.55,
          transmission: 0.65,
          roughness: 0.12,
          metalness: 0.08,
          depthWrite: false,
          clippingPlanes: clippingPlanesArray,
        }),
        new THREE.MeshPhysicalMaterial({
          color: tintGums ? '#F9A8D4' : '#93C5FD',
          transparent: true,
          opacity: 0.32,
          transmission: 0.8,
          roughness: 0.35,
          metalness: 0.02,
          depthWrite: false,
          clippingPlanes: clippingPlanesArray,
        }),
      ];
    }

    // Default: 'shaded' - Clinical Dental Ceramic / Gypsum with Studio Clearcoat
    return [
      new THREE.MeshPhysicalMaterial({
        color: enamelHex,
        roughness: 0.18,
        metalness: 0.01,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
        reflectivity: 0.9,
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      }),
      new THREE.MeshPhysicalMaterial({
        color: gingivaHex,
        roughness: 0.62,
        metalness: 0,
        clearcoat: 0.12,
        clearcoatRoughness: 0.6,
        reflectivity: 0.28,
        sheen: 0.65,
        sheenRoughness: 0.5,
        sheenColor: new THREE.Color('#FFD9DE'),
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      }),
    ];
  }, [renderMode, clippingPlanesArray, toothColor, gumColor, tintGums]);

  // Dispose the previous materials whenever new ones are created, and on unmount
  useEffect(() => {
    return () => {
      for (const material of archMaterials) material.dispose();
    };
  }, [archMaterials]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === 'measure') {
      e.stopPropagation();
      if (onPointClick && e.point) {
        onPointClick(e.point.clone());
      }
    }
  };

  const isBothVisible = showUpper && showLower && hasUpper && hasLower;

  // Real cusp-to-fossa occlusion registration: drop the lower arch into contact
  // with the upper (computeOcclusionOffset), then recenter the combined pair
  // vertically so the bite - not either arch's own bbox center - sits at the
  // scene origin (matching the camera/floor framing set up around y=0).
  const occlusionOffset = useMemo(() => {
    if (!activeUpperGeom || !activeLowerGeom) return null;
    return computeOcclusionOffset(activeUpperGeom, activeLowerGeom);
  }, [activeUpperGeom, activeLowerGeom]);

  const { upperPosY, lowerPosX, lowerPosY, lowerPosZ, lowerRotation } = useMemo(() => {
    if (!isBothVisible || !occlusionOffset || !activeUpperGeom || !activeLowerGeom) {
      return { upperPosY: 0, lowerPosX: 0, lowerPosY: 0, lowerPosZ: 0, lowerRotation: [0, 0, 0] as [number, number, number] };
    }

    activeUpperGeom.computeBoundingBox();
    activeLowerGeom.computeBoundingBox();
    const uBox = activeUpperGeom.boundingBox!;
    const lBox = activeLowerGeom.boundingBox!;
    const { dx, dy, dz, pitchRad, rollRad } = occlusionOffset;

    const combinedMinY = Math.min(uBox.min.y, lBox.min.y + dy);
    const combinedMaxY = Math.max(uBox.max.y, lBox.max.y + dy);
    const recenter = (combinedMinY + combinedMaxY) / 2;

    return {
      upperPosY: -recenter,
      lowerPosX: dx,
      lowerPosY: dy - recenter,
      lowerPosZ: dz,
      // Applied as rotation="[X, Y, Z]" with R3F's default 'XYZ' Euler order, which
      // composes as Rz*Rx*v - matching the rotateX-then-rotateZ order the offset's
      // pitch/roll were derived against in computeOcclusionOffset.
      lowerRotation: [pitchRad, 0, rollRad] as [number, number, number],
    };
  }, [isBothVisible, occlusionOffset, activeUpperGeom, activeLowerGeom]);

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      {/* UPPER ARCH */}
      {showUpper && activeUpperGeom && (
        <group
          name="UpperArch"
          position={[0, upperPosY, 0]}
          onPointerMove={(e) => handlePointerMove(e, 'upper')}
          onPointerOut={handlePointerOut}
        >
          <mesh
            geometry={activeUpperGeom}
            material={archMaterials}
            castShadow
            receiveShadow
          />
        </group>
      )}

      {/* LOWER ARCH */}
      {showLower && activeLowerGeom && (
        <group
          name="LowerArch"
          position={[lowerPosX, lowerPosY, lowerPosZ]}
          rotation={lowerRotation}
          onPointerMove={(e) => handlePointerMove(e, 'lower')}
          onPointerOut={handlePointerOut}
        >
          <mesh
            geometry={activeLowerGeom}
            material={archMaterials}
            castShadow
            receiveShadow
          />
        </group>
      )}
    </group>
  );
};
