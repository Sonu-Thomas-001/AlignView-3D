'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Line, MeshReflectorMaterial } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useViewerStore } from '@/store/useViewerStore';
import { DentalArchModel } from './DentalArchModel';
import { ToothHoverTooltip } from './ToothHoverTooltip';

// Camera controller with smooth tweening
const CameraController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { 
    cameraTargetView, 
    cameraTriggerCount, 
    resetViewTriggerCount, 
    activeTool 
  } = useViewerStore();

  const targetPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Handle camera snapping
  useEffect(() => {
    if (!cameraTargetView) return;

    const dist = 86;
    if (cameraTargetView === 'front' || cameraTargetView === 'reset') {
      targetPos.current = new THREE.Vector3(0, 4, dist);
    } else if (cameraTargetView === 'back') {
      targetPos.current = new THREE.Vector3(0, 4, -dist);
    } else if (cameraTargetView === 'top') {
      targetPos.current = new THREE.Vector3(0, dist, 0.001);
    } else if (cameraTargetView === 'bottom') {
      targetPos.current = new THREE.Vector3(0, -dist, 0.001);
    } else if (cameraTargetView === 'left') {
      targetPos.current = new THREE.Vector3(-dist, 4, 0);
    } else if (cameraTargetView === 'right') {
      targetPos.current = new THREE.Vector3(dist, 4, 0);
    }
  }, [cameraTargetView, cameraTriggerCount, resetViewTriggerCount]);

  useFrame((_, delta) => {
    if (targetPos.current) {
      camera.position.lerp(targetPos.current, Math.min(1, delta * 8));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, Math.min(1, delta * 8));
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(targetPos.current) < 0.2) {
        targetPos.current = null;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={25}
      maxDistance={170}
      rotateSpeed={activeTool === 'rotate' || activeTool === 'move' ? 0.85 : 0.45}
      panSpeed={activeTool === 'pan' ? 1.0 : 0.6}
      zoomSpeed={activeTool === 'zoom' ? 1.2 : 0.8}
    />
  );
};

// 3D Measurement Visuals in canvas
const MeasurementLines: React.FC = () => {
  const { measurements, pendingMeasurementPoint } = useViewerStore();

  return (
    <group name="MeasurementVisuals">
      {measurements.map((m, idx) => (
        <group key={idx}>
          <Line
            points={[
              [m.p1.x, m.p1.y, m.p1.z],
              [m.p2.x, m.p2.y, m.p2.z],
            ]}
            color="#38BDF8"
            lineWidth={3}
          />
          {/* Point 1 sphere */}
          <mesh position={[m.p1.x, m.p1.y, m.p1.z]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
          {/* Point 2 sphere */}
          <mesh position={[m.p2.x, m.p2.y, m.p2.z]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
        </group>
      ))}

      {pendingMeasurementPoint && (
        <mesh position={[pendingMeasurementPoint.x, pendingMeasurementPoint.y, pendingMeasurementPoint.z]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>
      )}
    </group>
  );
};

// Screenshot capture worker
const ScreenshotWorker: React.FC = () => {
  const { gl } = useThree();
  const { screenshotTriggerCount } = useViewerStore();
  const prevCount = useRef(screenshotTriggerCount);

  useEffect(() => {
    if (screenshotTriggerCount > 0 && screenshotTriggerCount !== prevCount.current) {
      prevCount.current = screenshotTriggerCount;
      const dataUrl = gl.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `alignview_3d_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [screenshotTriggerCount, gl]);

  return null;
};

// Sleek Dark Studio Reflective Floor with soft blur and dramatic contact shadow
const StudioReflectiveFloor: React.FC = () => {
  return (
    <group position={[0, -13.5, 0]}>
      {/* Reflective Dark Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mirror={0.32}
          mixBlur={1.0}
          mixStrength={1.8}
          roughness={0.24}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#111827"
          metalness={0.12}
        />
      </mesh>

      {/* Deep Contact Ambient Occlusion Shadow */}
      <ContactShadows
        position={[0, 0.05, 0]}
        opacity={0.68}
        scale={70}
        blur={2.4}
        far={20}
        color="#000000"
      />
    </group>
  );
};

export const DentalCanvas: React.FC = () => {
  const { 
    currentStep, 
    totalSteps, 
    activeTool, 
    sectionPlaneOffset, 
    sectionAxis, 
    addMeasurementPoint,
    viewMode,
  } = useViewerStore();

  // Dynamic clipping plane for sectioning tool
  const clippingPlane = useMemo(() => {
    if (activeTool !== 'section') return null;
    const normal = new THREE.Vector3(
      sectionAxis === 'x' ? 1 : 0,
      sectionAxis === 'y' ? 1 : 0,
      sectionAxis === 'z' ? 1 : 0
    );
    return new THREE.Plane(normal, -sectionPlaneOffset);
  }, [activeTool, sectionPlaneOffset, sectionAxis]);

  const handlePointClick = (pt: THREE.Vector3) => {
    addMeasurementPoint({
      id: Math.random().toString(),
      x: pt.x,
      y: pt.y,
      z: pt.z,
    });
  };

  const isSplit = viewMode === 'split';

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#0B0F19] to-[#080C14]">
      {isSplit ? (
        <div className="w-full h-full grid grid-cols-2 divide-x divide-slate-800">
          {/* Split View Left: Initial / Upper */}
          <div className="relative w-full h-full">
            <div className="absolute top-14 left-4 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-slate-200 shadow-sm border border-slate-700">
              Stage 1 (Initial)
            </div>
            <Canvas
              shadows
              camera={{ position: [0, 1, 78], fov: 36 }}
              gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
            >
              <color attach="background" args={['#0F172A']} />
              <ambientLight intensity={1.1} />
              <directionalLight position={[18, 28, 30]} intensity={2.0} castShadow />
              <directionalLight position={[-18, 12, 20]} intensity={0.9} />
              <directionalLight position={[0, 32, -22]} intensity={1.1} color="#93C5FD" />
              
              <DentalArchModel stage={1} totalStages={totalSteps} isSecondarySplit />
              <StudioReflectiveFloor />
              <CameraController />
            </Canvas>
          </div>

          {/* Split View Right: Current Stage */}
          <div className="relative w-full h-full">
            <div className="absolute top-14 left-4 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-sky-400 shadow-sm border border-sky-600/40">
              Stage {currentStep} (Current)
            </div>
            <Canvas
              shadows
              camera={{ position: [0, 1, 78], fov: 36 }}
              gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
            >
              <color attach="background" args={['#0B0F19']} />
              <ambientLight intensity={1.1} />
              <directionalLight position={[18, 28, 30]} intensity={2.0} castShadow />
              <directionalLight position={[-18, 12, 20]} intensity={0.9} />
              <directionalLight position={[0, 32, -22]} intensity={1.1} color="#93C5FD" />
              
              <DentalArchModel stage={currentStep} totalStages={totalSteps} />
              <StudioReflectiveFloor />
              <CameraController />
            </Canvas>
          </div>
        </div>
      ) : (
        /* Standard Unified Viewport */
        <Canvas
          shadows
          camera={{ position: [0, 4, 86], fov: 38 }}
          gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* Deep studio dark background */}
          <color attach="background" args={['#0F172A']} />
          
          {/* Studio Dental Lighting Setup with brilliant porcelain contrast */}
          <ambientLight intensity={1.15} />
          
          {/* Key Light for brilliant enamel highlights */}
          <directionalLight
            position={[18, 28, 32]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={10}
            shadow-camera-far={130}
            shadow-camera-left={-45}
            shadow-camera-right={45}
            shadow-camera-top={45}
            shadow-camera-bottom={-45}
            shadow-bias={-0.0005}
          />
          {/* Fill Light for natural anatomical shadows */}
          <directionalLight position={[-22, 12, 22]} intensity={0.95} color="#FFFFFF" />
          {/* Top Softbox Light for smooth anatomical reflections */}
          <directionalLight position={[0, 35, 10]} intensity={0.9} color="#FFFFFF" />
          {/* Rim Light for high-contrast edge definition */}
          <directionalLight position={[0, 25, -30]} intensity={1.1} color="#93C5FD" />
          {/* Floor Bounce Light */}
          <directionalLight position={[0, -18, 15]} intensity={0.4} color="#CBD5E1" />

          {/* Pure White Dental 3D Model */}
          <DentalArchModel
            stage={currentStep}
            totalStages={totalSteps}
            clippingPlane={clippingPlane}
            onPointClick={handlePointClick}
          />

          {/* Measurement markers & lines */}
          <MeasurementLines />

          {/* Studio Dark Floor with Glossy Reflection & Contact Shadow */}
          <StudioReflectiveFloor />

          {/* Camera Controller with smooth snaps */}
          <CameraController />

          {/* Screenshot capture worker */}
          <ScreenshotWorker />
        </Canvas>
      )}

      {/* Floating FDI Tooth Identification Tooltip */}
      <ToothHoverTooltip />
    </div>
  );
};
