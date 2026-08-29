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

  // Determine visibility based on viewMode
  const showUpper = isSecondarySplit ? true : (viewMode === 'both' || viewMode === 'upper' || viewMode === 'split');
  const showLower = isSecondarySplit ? true : (viewMode === 'both' || viewMode === 'lower' || viewMode === 'split');

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

  const { toothMaterial, gingivaMaterial } = useMemo(() => {
    const isWireframe = renderMode === 'wireframe';
    const isSolid = renderMode === 'solid';
    const isXRay = renderMode === 'xray';

    if (isWireframe) {
      const wireMat = new THREE.MeshBasicMaterial({
        color: '#2563EB',
        wireframe: true,
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      });
      return { toothMaterial: wireMat, gingivaMaterial: wireMat };
    }

    if (isSolid) {
      const solidTooth = new THREE.MeshLambertMaterial({
        color: '#E2E8F0',
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      });
      const solidGingiva = new THREE.MeshLambertMaterial({
        color: '#CBD5E1',
        clippingPlanes: clippingPlanesArray,
        clipShadows: true,
      });
      return { toothMaterial: solidTooth, gingivaMaterial: solidGingiva };
    }

    if (isXRay) {
      const xrayTooth = new THREE.MeshPhysicalMaterial({
        color: '#93C5FD',
        transparent: true,
        opacity: 0.45,
        transmission: 0.7,
        roughness: 0.1,
        metalness: 0.1,
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
      return { toothMaterial: xrayTooth, gingivaMaterial: xrayGingiva };
    }

    // Default: 'shaded' realistic dental PBR materials
    // Teeth: Natural pearlescent enamel with high clearcoat gloss
    const shadedTooth = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      roughness: 0.16,
      metalness: 0.02,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });

    // Gingiva: Realistic anatomical coral-pink tissue
    const shadedGingiva = new THREE.MeshStandardMaterial({
      color: '#E27885', // natural coral gum pink
      roughness: 0.38,
      metalness: 0.02,
      clippingPlanes: clippingPlanesArray,
      clipShadows: true,
    });

    return { toothMaterial: shadedTooth, gingivaMaterial: shadedGingiva };
  }, [renderMode, clippingPlanesArray]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === 'measure') {
      e.stopPropagation();
      if (onPointClick && e.point) {
        onPointClick(e.point.clone());
      }
    }
  };

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      {/* UPPER ARCH */}
      {showUpper && (
        <group name="UpperArch">
          {selectedUpperFile?.customBufferGeometry ? (
            <mesh
              geometry={selectedUpperFile.customBufferGeometry}
              material={toothMaterial}
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
        <group name="LowerArch">
          {selectedLowerFile?.customBufferGeometry ? (
            <mesh
              geometry={selectedLowerFile.customBufferGeometry}
              material={toothMaterial}
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
