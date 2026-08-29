'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Line } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useViewerStore } from '@/store/useViewerStore';
import { DentalArchModel } from './DentalArchModel';

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

    const dist = 80;
    if (cameraTargetView === 'front' || cameraTargetView === 'reset') {
      targetPos.current = new THREE.Vector3(0, 0, dist);
    } else if (cameraTargetView === 'back') {
      targetPos.current = new THREE.Vector3(0, 0, -dist);
    } else if (cameraTargetView === 'top') {
      targetPos.current = new THREE.Vector3(0, dist, 0.001);
    } else if (cameraTargetView === 'bottom') {
      targetPos.current = new THREE.Vector3(0, -dist, 0.001);
    } else if (cameraTargetView === 'left') {
      targetPos.current = new THREE.Vector3(-dist, 0, 0);
    } else if (cameraTargetView === 'right') {
      targetPos.current = new THREE.Vector3(dist, 0, 0);
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
      minDistance={20}
      maxDistance={180}
      rotateSpeed={activeTool === 'rotate' || activeTool === 'move' ? 0.8 : 0.4}
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
            color="#2563EB"
            lineWidth={3}
          />
          {/* Point 1 sphere */}
          <mesh position={[m.p1.x, m.p1.y, m.p1.z]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#2563EB" />
          </mesh>
          {/* Point 2 sphere */}
          <mesh position={[m.p2.x, m.p2.y, m.p2.z]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#2563EB" />
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
      link.download = `dental_stl_preview_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [screenshotTriggerCount, gl]);

  return null;
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
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#E7EDF6] via-[#E2E8F0] to-[#D5DEEC]">
      {isSplit ? (
        <div className="w-full h-full grid grid-cols-2 divide-x divide-slate-300">
          {/* Split View Left: Initial / Upper */}
          <div className="relative w-full h-full">
            <div className="absolute top-14 left-4 z-10 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 shadow-sm">
              Stage 1 (Initial)
            </div>
            <Canvas
              shadows
              camera={{ position: [0, 0, 80], fov: 38 }}
              gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
            >
              <color attach="background" args={['#EAEFF7']} />
              <ambientLight intensity={1.2} />
              <directionalLight position={[10, 20, 25]} intensity={1.5} castShadow />
              <directionalLight position={[-15, -10, -15]} intensity={0.5} />
              <directionalLight position={[0, 15, -20]} intensity={0.6} color="#BEE3F8" />
              
              <DentalArchModel stage={1} totalStages={totalSteps} isSecondarySplit />
              <ContactShadows position={[0, -14, 0]} opacity={0.4} scale={60} blur={2} far={15} />
              <CameraController />
            </Canvas>
          </div>

          {/* Split View Right: Current Stage */}
          <div className="relative w-full h-full">
            <div className="absolute top-14 left-4 z-10 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 shadow-sm border border-blue-200">
              Stage {currentStep} (Current)
            </div>
            <Canvas
              shadows
              camera={{ position: [0, 0, 80], fov: 38 }}
              gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
            >
              <color attach="background" args={['#E5ECF6']} />
              <ambientLight intensity={1.2} />
              <directionalLight position={[10, 20, 25]} intensity={1.5} castShadow />
              <directionalLight position={[-15, -10, -15]} intensity={0.5} />
              <directionalLight position={[0, 15, -20]} intensity={0.6} color="#BEE3F8" />
              
              <DentalArchModel stage={currentStep} totalStages={totalSteps} />
              <ContactShadows position={[0, -14, 0]} opacity={0.4} scale={60} blur={2} far={15} />
              <CameraController />
            </Canvas>
          </div>
        </div>
      ) : (
        /* Standard Unified Viewport */
        <Canvas
          shadows
          camera={{ position: [0, 0, 75], fov: 36 }}
          gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* Subtle studio gradient background */}
          <color attach="background" args={['#E6ECF5']} />
          
          {/* Studio Dental Lighting Setup */}
          <ambientLight intensity={1.3} />
          {/* Main Key Light with crisp soft shadow */}
          <directionalLight
            position={[15, 25, 30]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={10}
            shadow-camera-far={120}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
            shadow-bias={-0.0005}
          />
          {/* Fill Light for natural ambient detail */}
          <directionalLight position={[-20, 10, 20]} intensity={0.8} color="#FFFFFF" />
          {/* Rim / Hair Light for high-end medical 3D depth */}
          <directionalLight position={[0, 30, -25]} intensity={0.9} color="#D0E2FF" />
          {/* Subtle bottom bounce light */}
          <directionalLight position={[0, -20, 15]} intensity={0.4} color="#FFF5F5" />

          {/* Dental 3D Model with teeth, gingiva, and movement */}
          <DentalArchModel
            stage={currentStep}
            totalStages={totalSteps}
            clippingPlane={clippingPlane}
            onPointClick={handlePointClick}
          />

          {/* Measurement markers & lines */}
          <MeasurementLines />

          {/* Soft Ground Contact Shadow & Subtle Floor Reflection Plane */}
          <ContactShadows
            position={[0, -14, 0]}
            opacity={0.45}
            scale={70}
            blur={2.4}
            far={20}
            color="#334155"
          />

          {/* Camera Controller with smooth snaps */}
          <CameraController />

          {/* Screenshot capture worker */}
          <ScreenshotWorker />
        </Canvas>
      )}
    </div>
  );
};
