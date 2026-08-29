'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useViewerStore } from '@/store/useViewerStore';
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
  } = useViewerStore();

  const groupRef = useRef<THREE.Group>(null);

  // Check if active file has custom uploaded geometry
  const selectedUpperFile = useMemo(() => upperFiles.find(f => f.id === selectedUpperId), [upperFiles, selectedUpperId]);
  const selectedLowerFile = useMemo(() => lowerFiles.find(f => f.id === selectedLowerId), [lowerFiles, selectedLowerId]);

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

    // Custom Upper Arch (Realistic Anatomical Colors with High Gloss Clearcoat)
    const upperCustom = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      vertexColors: true,
      roughness: 0.20,
      metalness: 0.02,
      clearcoat: 0.88,
      clearcoatRoughness: 0.12,
      reflectivity: 0.88,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });

    // Custom Lower Arch (Realistic Anatomical Colors with High Gloss Clearcoat)
    const lowerCustom = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      vertexColors: true,
      roughness: 0.20,
      metalness: 0.02,
      clearcoat: 0.88,
      clearcoatRoughness: 0.12,
      reflectivity: 0.88,
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

  // Position offsets:
  // When both arches are visible, place upper slightly above and lower slightly below occlusal plane
  const isBothVisible = (viewMode === 'both' || viewMode === 'split' || isSecondarySplit) && hasUpper && hasLower;
  const upperPosY = isBothVisible ? 3.5 : 0;
  const lowerPosY = isBothVisible ? -3.5 : 0;

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      {/* UPPER ARCH */}
      {showUpper && (
        <group name="UpperArch" position={[0, upperPosY, 0]}>
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
        <group name="LowerArch" position={[0, lowerPosY, 0]}>
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
