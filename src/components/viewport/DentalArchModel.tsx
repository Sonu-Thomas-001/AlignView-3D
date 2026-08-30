import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three-stdlib';
import { useViewerStore } from '@/store/useViewerStore';
import { normalizeDentalGeometry } from '@/utils/stlParser';
import { getFDIToothFromPoint } from '@/utils/fdiToothMap';
import { UPPER_TEETH, LOWER_TEETH, createToothGeometry, getToothTransform, createGingivaGeometry } from './DentalGeometryGenerator';

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
    isPlaying,
    modelColor,
  } = useViewerStore();

  const groupRef = useRef<THREE.Group>(null);
  const [, setReloadCounter] = useState(0);

  // Check if active file has custom uploaded geometry
  const selectedUpperFile = useMemo(() => upperFiles.find(f => f.id === selectedUpperId), [upperFiles, selectedUpperId]);
  const selectedLowerFile = useMemo(() => lowerFiles.find(f => f.id === selectedLowerId), [lowerFiles, selectedLowerId]);

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

  // Dynamic async loader for real STL files from STL folder
  useEffect(() => {
    if (selectedUpperFile?.customUrl && !selectedUpperFile.customBufferGeometry) {
      const loader = new STLLoader();
      loader.load(
        selectedUpperFile.customUrl,
        (geometry) => {
          const normalized = normalizeDentalGeometry(geometry, 'upper');
          selectedUpperFile.customBufferGeometry = normalized;
          setReloadCounter(c => c + 1);
        },
        undefined,
        (err) => console.warn('Failed loading upper STL:', err)
      );
    }
  }, [selectedUpperFile?.customUrl, selectedUpperFile]);

  useEffect(() => {
    if (selectedLowerFile?.customUrl && !selectedLowerFile.customBufferGeometry) {
      const loader = new STLLoader();
      loader.load(
        selectedLowerFile.customUrl,
        (geometry) => {
          const normalized = normalizeDentalGeometry(geometry, 'lower');
          selectedLowerFile.customBufferGeometry = normalized;
          setReloadCounter(c => c + 1);
        },
        undefined,
        (err) => console.warn('Failed loading lower STL:', err)
      );
    }
  }, [selectedLowerFile?.customUrl, selectedLowerFile]);

  // Pre-generate procedural teeth fallback geometries
  const upperGeometries = useMemo(() => {
    return UPPER_TEETH.map(tooth => ({
      tooth,
      geom: createToothGeometry(tooth, 'upper'),
    }));
  }, []);

  const lowerGeometries = useMemo(() => {
    return LOWER_TEETH.map(tooth => ({
      tooth,
      geom: createToothGeometry(tooth, 'lower'),
    }));
  }, []);

  const upperGingivaGeom = useMemo(() => createGingivaGeometry('upper'), []);
  const lowerGingivaGeom = useMemo(() => createGingivaGeometry('lower'), []);

  // Smooth animation interpolation during playback
  const currentInterpolation = useRef(0);
  const targetInterpolation = stage / totalStages;

  useFrame((_, delta) => {
    if (isPlaying) {
      currentInterpolation.current = THREE.MathUtils.lerp(
        currentInterpolation.current,
        targetInterpolation,
        delta * 6
      );
    } else {
      currentInterpolation.current = targetInterpolation;
    }
  });

  const showUpper = viewMode === 'both' || viewMode === 'upper' || viewMode === 'split' || isSecondarySplit;
  const showLower = (viewMode === 'both' || viewMode === 'lower' || viewMode === 'split') && !isSecondarySplit;

  const hasUpper = upperFiles.length > 0;
  const hasLower = lowerFiles.length > 0;

  // Material selection based on render mode
  const clippingPlanesArray = useMemo(() => (clippingPlane ? [clippingPlane] : []), [clippingPlane]);

  const { toothMaterial, gingivaMaterial, upperCustomMaterial, lowerCustomMaterial } = useMemo(() => {
    if (renderMode === 'wireframe') {
      const wire = new THREE.MeshBasicMaterial({
        color: '#38BDF8',
        wireframe: true,
        clippingPlanes: clippingPlanesArray,
      });
      return { 
        toothMaterial: wire, 
        gingivaMaterial: wire,
        upperCustomMaterial: wire,
        lowerCustomMaterial: wire
      };
    }

    if (renderMode === 'solid') {
      const solid = new THREE.MeshLambertMaterial({
        color: modelColor || '#FFFFFF',
        clippingPlanes: clippingPlanesArray,
      });
      return { 
        toothMaterial: solid, 
        gingivaMaterial: solid,
        upperCustomMaterial: solid,
        lowerCustomMaterial: solid
      };
    }

    if (renderMode === 'xray') {
      const xrayUpper = new THREE.MeshPhysicalMaterial({
        color: '#93C5FD',
        transparent: true,
        opacity: 0.55,
        transmission: 0.65,
        roughness: 0.12,
        metalness: 0.08,
        depthWrite: false,
        clippingPlanes: clippingPlanesArray,
      });
      const xrayLower = new THREE.MeshPhysicalMaterial({
        color: '#6EE7B7',
        transparent: true,
        opacity: 0.55,
        transmission: 0.65,
        roughness: 0.12,
        metalness: 0.08,
        depthWrite: false,
        clippingPlanes: clippingPlanesArray,
      });
      const xrayGingiva = new THREE.MeshPhysicalMaterial({
        color: '#CBD5E1',
        transparent: true,
        opacity: 0.35,
        transmission: 0.6,
        roughness: 0.2,
        depthWrite: false,
        clippingPlanes: clippingPlanesArray,
      });
      return { 
        toothMaterial: xrayUpper, 
        gingivaMaterial: xrayGingiva,
        upperCustomMaterial: xrayUpper,
        lowerCustomMaterial: xrayLower
      };
    }

    // Default: 'shaded' - Clinical Dental Ceramic / Gypsum with Studio Clearcoat
    const shadedDental = new THREE.MeshPhysicalMaterial({
      color: modelColor || '#FFFFFF',
      roughness: 0.18,
      metalness: 0.01,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });

    return { 
      toothMaterial: shadedDental, 
      gingivaMaterial: shadedDental,
      upperCustomMaterial: shadedDental,
      lowerCustomMaterial: shadedDental
    };
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
    if (!selectedUpperFile?.customBufferGeometry) return 15.6;
    selectedUpperFile.customBufferGeometry.computeBoundingBox();
    const bbox = selectedUpperFile.customBufferGeometry.boundingBox;
    return bbox ? (bbox.max.y - bbox.min.y) : 15.6;
  }, [selectedUpperFile]);

  const lowerBBoxHeight = useMemo(() => {
    if (!selectedLowerFile?.customBufferGeometry) return 13.2;
    selectedLowerFile.customBufferGeometry.computeBoundingBox();
    const bbox = selectedLowerFile.customBufferGeometry.boundingBox;
    return bbox ? (bbox.max.y - bbox.min.y) : 13.2;
  }, [selectedLowerFile]);

  const isBothVisible = (viewMode === 'both' || viewMode === 'split' || isSecondarySplit) && hasUpper && hasLower;
  const upperPosY = isBothVisible ? (upperBBoxHeight * 0.352) : 0;
  const lowerPosY = isBothVisible ? (-lowerBBoxHeight * 0.395) : 0;
  const lowerPosZ = isBothVisible ? -0.5 : 0;

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      {/* UPPER ARCH */}
      {showUpper && (
        <group
          name="UpperArch"
          position={[0, upperPosY, 0]}
          onPointerMove={(e) => handlePointerMove(e, 'upper')}
          onPointerOut={handlePointerOut}
        >
          {selectedUpperFile?.customBufferGeometry ? (
            <mesh
              geometry={selectedUpperFile.customBufferGeometry}
              material={upperCustomMaterial}
              castShadow
              receiveShadow
            />
          ) : (
            <>
              {/* Upper Teeth */}
              {upperGeometries.map(({ tooth, geom }) => {
                const transform = getToothTransform(tooth, stage, totalStages);
                return (
                  <mesh
                    key={tooth.id}
                    geometry={geom}
                    material={toothMaterial}
                    position={transform.position}
                    rotation={transform.rotation}
                    castShadow
                    receiveShadow
                  />
                );
              })}
              {/* Upper Gingiva (Gums) */}
              <mesh
                geometry={upperGingivaGeom}
                material={gingivaMaterial}
                castShadow
                receiveShadow
              />
            </>
          )}
        </group>
      )}

      {/* LOWER ARCH */}
      {showLower && (
        <group
          name="LowerArch"
          position={[0, lowerPosY, lowerPosZ]}
          onPointerMove={(e) => handlePointerMove(e, 'lower')}
          onPointerOut={handlePointerOut}
        >
          {selectedLowerFile?.customBufferGeometry ? (
            <mesh
              geometry={selectedLowerFile.customBufferGeometry}
              material={lowerCustomMaterial}
              castShadow
              receiveShadow
            />
          ) : (
            <>
              {/* Lower Teeth */}
              {lowerGeometries.map(({ tooth, geom }) => {
                const transform = getToothTransform(tooth, stage, totalStages);
                return (
                  <mesh
                    key={tooth.id}
                    geometry={geom}
                    material={toothMaterial}
                    position={transform.position}
                    rotation={transform.rotation}
                    castShadow
                    receiveShadow
                  />
                );
              })}
              {/* Lower Gingiva (Gums) */}
              <mesh
                geometry={lowerGingivaGeom}
                material={gingivaMaterial}
                castShadow
                receiveShadow
              />
            </>
          )}
        </group>
      )}
    </group>
  );
};
