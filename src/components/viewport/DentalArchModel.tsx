import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three-stdlib';
import { useViewerStore } from '@/store/useViewerStore';
import { normalizeDentalGeometry } from '@/utils/stlParser';
import { getFDIToothFromPoint } from '@/utils/fdiToothMap';
import { segmentDentalMeshAI, applyAISegmentationLabels, fetchMeshSegNetSegmentation } from '@/utils/aiDentalSegmenter';
import { getFDIToothByID } from '@/utils/fdiToothMap';
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
  } = useViewerStore();

  const groupRef = useRef<THREE.Group>(null);
  const [upperSegmentation, setUpperSegmentation] = useState<number[] | null>(null);
  const [lowerSegmentation, setLowerSegmentation] = useState<number[] | null>(null);
  const [, setReloadCounter] = useState(0);

  // Check if active file has custom uploaded geometry
  const selectedUpperFile = useMemo(() => upperFiles.find(f => f.id === selectedUpperId), [upperFiles, selectedUpperId]);
  const selectedLowerFile = useMemo(() => lowerFiles.find(f => f.id === selectedLowerId), [lowerFiles, selectedLowerId]);

  // Request MeshSegNet deep segmentation when upper arch changes
  useEffect(() => {
    let cancelled = false;
    if (selectedUpperFile?.name) {
      fetchMeshSegNetSegmentation(selectedUpperFile.name, 'upper').then(res => {
        if (!cancelled && res?.fdiLabels) {
          setUpperSegmentation(res.fdiLabels);
        }
      });
    }
    return () => { cancelled = true; };
  }, [selectedUpperFile?.name, selectedUpperId]);

  // Request MeshSegNet deep segmentation when lower arch changes
  useEffect(() => {
    let cancelled = false;
    if (selectedLowerFile?.name) {
      fetchMeshSegNetSegmentation(selectedLowerFile.name, 'lower').then(res => {
        if (!cancelled && res?.fdiLabels) {
          setLowerSegmentation(res.fdiLabels);
        }
      });
    }
    return () => { cancelled = true; };
  }, [selectedLowerFile?.name, selectedLowerId]);

  // Dynamically apply AI scalloped segmentation & white attachment coloring
  const upperRenderGeom = useMemo(() => {
    if (!selectedUpperFile?.customBufferGeometry) return null;
    const cloned = selectedUpperFile.customBufferGeometry.clone();
    if (upperSegmentation) {
      return applyAISegmentationLabels(cloned, upperSegmentation, 'upper');
    }
    return segmentDentalMeshAI(cloned, 'upper');
  }, [selectedUpperFile?.customBufferGeometry, upperSegmentation]);

  const lowerRenderGeom = useMemo(() => {
    if (!selectedLowerFile?.customBufferGeometry) return null;
    const cloned = selectedLowerFile.customBufferGeometry.clone();
    if (lowerSegmentation) {
      return applyAISegmentationLabels(cloned, lowerSegmentation, 'lower');
    }
    return segmentDentalMeshAI(cloned, 'lower');
  }, [selectedLowerFile?.customBufferGeometry, lowerSegmentation]);

  // Handle FDI Tooth Hover Tooltip
  const handlePointerMove = (e: ThreeEvent<PointerEvent>, arch: 'upper' | 'lower') => {
    if (activeTool === 'measure') return;
    e.stopPropagation();

    // 1. Check direct per-triangle MeshSegNet classification
    const targetGeom = arch === 'upper' ? upperRenderGeom : lowerRenderGeom;
    const fdiLabels = targetGeom?.userData?.fdiLabels;

    if (fdiLabels && e.faceIndex !== undefined && e.faceIndex !== null) {
      const fdi = fdiLabels[e.faceIndex];
      if (fdi > 0) {
        const tooth = getFDIToothByID(fdi);
        if (tooth) {
          setHoveredTooth({
            ...tooth,
            screenX: e.clientX,
            screenY: e.clientY,
          });
          return;
        }
      }
    }

    // 2. Spatial geometric fallback
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
        (err) => console.error('Failed to load upper STL:', err)
      );
    }
  }, [selectedUpperFile, selectedUpperId]);

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
        (err) => console.error('Failed to load lower STL:', err)
      );
    }
  }, [selectedLowerFile, selectedLowerId]);

  // Determine visibility based on viewMode and whether arch files exist
  const hasUpper = upperFiles.length > 0;
  const hasLower = lowerFiles.length > 0;
  const showUpper = hasUpper && (isSecondarySplit ? true : (viewMode === 'both' || viewMode === 'upper' || viewMode === 'split'));
  const showLower = hasLower && (isSecondarySplit ? true : (viewMode === 'both' || viewMode === 'lower' || viewMode === 'split'));

  // Pre-generate tooth geometries for upper and lower
  const upperGeometries = useMemo(() => {
    return UPPER_TEETH.map(t => ({
      tooth: t,
      geom: createToothGeometry(t),
    }));
  }, []);

  const lowerGeometries = useMemo(() => {
    return LOWER_TEETH.map(t => ({
      tooth: t,
      geom: createToothGeometry(t),
    }));
  }, []);

  // Generate gingiva geometries based on current treatment stage
  const upperGingivaGeom = useMemo(() => {
    return createGingivaGeometry('upper', stage, totalStages);
  }, [stage, totalStages]);

  const lowerGingivaGeom = useMemo(() => {
    return createGingivaGeometry('lower', stage, totalStages);
  }, [stage, totalStages]);

  // Materials based on renderMode
  const clippingPlanesArray = useMemo(() => {
    return clippingPlane ? [clippingPlane] : [];
  }, [clippingPlane]);

  const { 
    toothMaterial, 
    gingivaMaterial, 
    upperCustomMaterial, 
    lowerCustomMaterial 
  } = useMemo(() => {
    const isWireframe = renderMode === 'wireframe';
    const isSolid = renderMode === 'solid';
    const isXRay = renderMode === 'xray';

    if (isWireframe) {
      const upperWire = new THREE.MeshBasicMaterial({
        color: '#2563EB',
        wireframe: true,
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      });
      const lowerWire = new THREE.MeshBasicMaterial({
        color: '#059669',
        wireframe: true,
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      });
      return { 
        toothMaterial: upperWire, 
        gingivaMaterial: upperWire,
        upperCustomMaterial: upperWire,
        lowerCustomMaterial: lowerWire
      };
    }

    if (isSolid) {
      const solidUpper = new THREE.MeshLambertMaterial({
        color: '#F1F5F9',
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      });
      const solidLower = new THREE.MeshLambertMaterial({
        color: '#E2E8F0',
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      });
      const solidGingiva = new THREE.MeshLambertMaterial({
        color: '#CBD5E1',
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      });
      return { 
        toothMaterial: solidUpper, 
        gingivaMaterial: solidGingiva,
        upperCustomMaterial: solidUpper,
        lowerCustomMaterial: solidLower
      };
    }

    if (isXRay) {
      const xrayUpper = new THREE.MeshPhysicalMaterial({
        color: '#7DD3FC',
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
        color: '#F472B6',
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

    // Default: 'shaded' - Realistic Dental Porcelain & Enamel with Studio Clearcoat
    const shadedTooth = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      roughness: 0.16,
      metalness: 0.02,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });

    const shadedGingiva = new THREE.MeshStandardMaterial({
      color: '#E27885', // natural coral gum pink
      roughness: 0.38,
      metalness: 0.02,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });

    // Custom Upper Arch (Realistic Anatomical Colors matching reference image)
    const upperCustom = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.20,
      metalness: 0.01,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.8,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });

    // Custom Lower Arch (Realistic Anatomical Colors matching reference image)
    const lowerCustom = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.20,
      metalness: 0.01,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.8,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });

    return { 
      toothMaterial: shadedTooth, 
      gingivaMaterial: shadedGingiva,
      upperCustomMaterial: upperCustom,
      lowerCustomMaterial: lowerCustom
    };
  }, [renderMode, clippingPlanesArray]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === 'measure') {
      e.stopPropagation();
      if (onPointClick && e.point) {
        onPointClick(e.point.clone());
      }
    }
  };

  // Calculate natural clinical centric occlusion heights:
  // When both arches are visible, lift Upper so lowest cusps touch Y = 0
  // and lower Lower so highest cusps touch Y = 0, creating the true natural bite.
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
  // Natural Angle Class I Closed Centric Occlusion:
  // - Zero-gap molar & premolar interdigitation
  // - Natural 1.6 mm anterior overjet and 2.5 mm overbite
  // - Perfectly closed aesthetic bite
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
          {upperRenderGeom ? (
            <mesh
              geometry={upperRenderGeom}
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
          {lowerRenderGeom ? (
            <mesh
              geometry={lowerRenderGeom}
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
