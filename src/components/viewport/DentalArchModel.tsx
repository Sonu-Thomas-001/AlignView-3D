import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three-stdlib';
import { useViewerStore } from '@/store/useViewerStore';
import { normalizeDentalGeometry } from '@/utils/stlParser';
import { computeOcclusionOffset } from '@/utils/occlusion';
import { getFDIToothFromPoint } from '@/utils/fdiToothMap';

// Global cache for loaded and normalized STL geometries
const geometryCache = new Map<string, THREE.BufferGeometry>();

interface DentalArchModelProps {
  stage: number;
  totalStages?: number;
  clippingPlane?: THREE.Plane | null;
  onPointClick?: (point: THREE.Vector3) => void;
  isSecondarySplit?: boolean;
}

export const DentalArchModel: React.FC<DentalArchModelProps> = ({
  stage,
  totalStages = 32,
  clippingPlane = null,
  onPointClick,
  isSecondarySplit = false,
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
    modelColor,
  } = useViewerStore();

  const groupRef = useRef<THREE.Group>(null);
  const [activeUpperGeom, setActiveUpperGeom] = useState<THREE.BufferGeometry | null>(null);
  const [activeLowerGeom, setActiveLowerGeom] = useState<THREE.BufferGeometry | null>(null);

  // Active files
  const selectedUpperFile = useMemo(() => upperFiles.find(f => f.id === selectedUpperId) || upperFiles[0], [upperFiles, selectedUpperId]);
  const selectedLowerFile = useMemo(() => lowerFiles.find(f => f.id === selectedLowerId) || lowerFiles[0], [lowerFiles, selectedLowerId]);

  // Load and cache Upper STL geometry
  useEffect(() => {
    if (!selectedUpperFile) {
      setActiveUpperGeom(null);
      return;
    }

    // 1. If buffer geometry was already parsed in memory from file upload
    if (selectedUpperFile.customBufferGeometry) {
      setActiveUpperGeom(selectedUpperFile.customBufferGeometry);
      return;
    }

    // 2. Otherwise load via customUrl if present
    const url = selectedUpperFile.customUrl;
    if (!url) return;

    if (geometryCache.has(url)) {
      const cached = geometryCache.get(url)!;
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
        const normalized = normalizeDentalGeometry(geometry, 'upper');
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
  }, [selectedUpperFile, selectedUpperFile?.customBufferGeometry]);

  // Load and cache Lower STL geometry
  useEffect(() => {
    if (!selectedLowerFile) {
      setActiveLowerGeom(null);
      return;
    }

    // 1. If buffer geometry was already parsed in memory from file upload
    if (selectedLowerFile.customBufferGeometry) {
      setActiveLowerGeom(selectedLowerFile.customBufferGeometry);
      return;
    }

    // 2. Otherwise load via customUrl if present
    const url = selectedLowerFile.customUrl;
    if (!url) return;

    if (geometryCache.has(url)) {
      const cached = geometryCache.get(url)!;
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
        const normalized = normalizeDentalGeometry(geometry, 'lower');
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
  }, [selectedLowerFile, selectedLowerFile?.customBufferGeometry]);

  // Handle FDI Tooth Hover Tooltip via 3D spatial dental mapping
  const handlePointerMove = (e: ThreeEvent<PointerEvent>, arch: 'upper' | 'lower') => {
    if (activeTool === 'measure') return;
    e.stopPropagation();

    if (e.point) {
      const tooth = getFDIToothFromPoint(e.point, arch);
      setHoveredTooth({
        ...tooth,
        screenX: e.clientX,
        screenY: e.clientY,
      });
    }
  };

  const handlePointerOut = () => {
    setHoveredTooth(null);
  };

  const showUpper = viewMode === 'both' || viewMode === 'upper' || viewMode === 'split' || isSecondarySplit;
  const showLower = (viewMode === 'both' || viewMode === 'lower' || viewMode === 'split') && !isSecondarySplit;

  const hasUpper = upperFiles.length > 0;
  const hasLower = lowerFiles.length > 0;

  // Material selection based on render mode & user custom color
  const clippingPlanesArray = useMemo(() => (clippingPlane ? [clippingPlane] : []), [clippingPlane]);

  const archMaterial = useMemo(() => {
    if (renderMode === 'wireframe') {
      return new THREE.MeshBasicMaterial({
        color: '#38BDF8',
        wireframe: true,
        clippingPlanes: clippingPlanesArray,
      });
    }

    if (renderMode === 'solid') {
      return new THREE.MeshLambertMaterial({
        color: modelColor || '#FFFFFF',
        clippingPlanes: clippingPlanesArray,
      });
    }

    if (renderMode === 'xray') {
      return new THREE.MeshPhysicalMaterial({
        color: '#93C5FD',
        transparent: true,
        opacity: 0.55,
        transmission: 0.65,
        roughness: 0.12,
        metalness: 0.08,
        depthWrite: false,
        clippingPlanes: clippingPlanesArray,
      });
    }

    // Default: 'shaded' - Clinical Dental Ceramic / Gypsum with Studio Clearcoat
    return new THREE.MeshPhysicalMaterial({
      color: modelColor || '#FFFFFF',
      roughness: 0.18,
      metalness: 0.01,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });
  }, [renderMode, clippingPlanesArray, modelColor]);

  // Dispose the previous material whenever a new one is created, and on unmount
  useEffect(() => {
    return () => {
      archMaterial.dispose();
    };
  }, [archMaterial]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === 'measure') {
      e.stopPropagation();
      if (onPointClick && e.point) {
        onPointClick(e.point.clone());
      }
    }
  };

  const isBothVisible = (viewMode === 'both' || viewMode === 'split' || isSecondarySplit) && hasUpper && hasLower;

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
            material={archMaterial}
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
            material={archMaterial}
            castShadow
            receiveShadow
          />
        </group>
      )}
    </group>
  );
};
