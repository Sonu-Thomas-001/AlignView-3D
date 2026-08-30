import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three-stdlib';
import { useViewerStore } from '@/store/useViewerStore';
import { normalizeDentalGeometry } from '@/utils/stlParser';
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
    if (!selectedUpperFile?.customUrl) return;

    if (geometryCache.has(selectedUpperFile.customUrl)) {
      const cached = geometryCache.get(selectedUpperFile.customUrl)!;
      setActiveUpperGeom(cached);
      selectedUpperFile.customBufferGeometry = cached;
      return;
    }

    if (selectedUpperFile.customBufferGeometry) {
      geometryCache.set(selectedUpperFile.customUrl, selectedUpperFile.customBufferGeometry);
      setActiveUpperGeom(selectedUpperFile.customBufferGeometry);
      return;
    }

    const loader = new STLLoader();
    loader.load(
      selectedUpperFile.customUrl,
      (geometry) => {
        const normalized = normalizeDentalGeometry(geometry, 'upper');
        geometryCache.set(selectedUpperFile.customUrl, normalized);
        selectedUpperFile.customBufferGeometry = normalized;
        setActiveUpperGeom(normalized);
      },
      undefined,
      (err) => console.warn('Error loading Upper STL:', err)
    );
  }, [selectedUpperFile?.customUrl, selectedUpperFile]);

  // Load and cache Lower STL geometry
  useEffect(() => {
    if (!selectedLowerFile?.customUrl) return;

    if (geometryCache.has(selectedLowerFile.customUrl)) {
      const cached = geometryCache.get(selectedLowerFile.customUrl)!;
      setActiveLowerGeom(cached);
      selectedLowerFile.customBufferGeometry = cached;
      return;
    }

    if (selectedLowerFile.customBufferGeometry) {
      geometryCache.set(selectedLowerFile.customUrl, selectedLowerFile.customBufferGeometry);
      setActiveLowerGeom(selectedLowerFile.customBufferGeometry);
      return;
    }

    const loader = new STLLoader();
    loader.load(
      selectedLowerFile.customUrl,
      (geometry) => {
        const normalized = normalizeDentalGeometry(geometry, 'lower');
        geometryCache.set(selectedLowerFile.customUrl, normalized);
        selectedLowerFile.customBufferGeometry = normalized;
        setActiveLowerGeom(normalized);
      },
      undefined,
      (err) => console.warn('Error loading Lower STL:', err)
    );
  }, [selectedLowerFile?.customUrl, selectedLowerFile]);

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

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === 'measure') {
      e.stopPropagation();
      if (onPointClick && e.point) {
        onPointClick(e.point.clone());
      }
    }
  };

  // Calculate natural clinical centric occlusion heights:
  const upperBBoxHeight = useMemo(() => {
    if (!activeUpperGeom) return 15.6;
    activeUpperGeom.computeBoundingBox();
    const bbox = activeUpperGeom.boundingBox;
    return bbox ? (bbox.max.y - bbox.min.y) : 15.6;
  }, [activeUpperGeom]);

  const lowerBBoxHeight = useMemo(() => {
    if (!activeLowerGeom) return 13.2;
    activeLowerGeom.computeBoundingBox();
    const bbox = activeLowerGeom.boundingBox;
    return bbox ? (bbox.max.y - bbox.min.y) : 13.2;
  }, [activeLowerGeom]);

  const isBothVisible = (viewMode === 'both' || viewMode === 'split' || isSecondarySplit) && hasUpper && hasLower;
  const upperPosY = isBothVisible ? (upperBBoxHeight * 0.352) : 0;
  const lowerPosY = isBothVisible ? (-lowerBBoxHeight * 0.395) : 0;
  const lowerPosZ = isBothVisible ? -0.5 : 0;

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
          position={[0, lowerPosY, lowerPosZ]}
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
