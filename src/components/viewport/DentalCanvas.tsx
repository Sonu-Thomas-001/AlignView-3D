'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Line, MeshReflectorMaterial } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useViewerStore } from '@/store/useViewerStore';
import { DentalArchModel } from './DentalArchModel';
import { ToothHoverTooltip } from './ToothHoverTooltip';
import { maxStageOf } from '@/utils/stlParser';
import { Upload, PauseCircle } from 'lucide-react';

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

/**
 * Captures every WebGL canvas inside the viewport and composites them side by side
 * into a single PNG. Reading the canvases from the DOM (rather than from inside one
 * `Canvas` via `useThree`) is what lets Split View export both stages in one image;
 * every canvas is created with `preserveDrawingBuffer` so the backing pixels are
 * still readable after the frame has been presented.
 */
function useViewportScreenshot(
  hostRef: React.RefObject<HTMLDivElement | null>,
  backgroundColor: string,
  fileNameHint: string,
) {
  const screenshotTriggerCount = useViewerStore((s) => s.screenshotTriggerCount);
  const prevCount = useRef(screenshotTriggerCount);

  useEffect(() => {
    if (screenshotTriggerCount === 0 || screenshotTriggerCount === prevCount.current) return;
    prevCount.current = screenshotTriggerCount;

    const host = hostRef.current;
    if (!host) return;

    const canvases = Array.from(host.querySelectorAll('canvas')) as HTMLCanvasElement[];
    const usable = canvases.filter((c) => c.width > 0 && c.height > 0);
    if (usable.length === 0) return;

    const gap = usable.length > 1 ? 20 : 0;
    const width = usable.reduce((sum, c) => sum + c.width, 0) + gap * (usable.length - 1);
    const height = Math.max(...usable.map((c) => c.height));

    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    let x = 0;
    for (const canvas of usable) {
      ctx.drawImage(canvas, x, 0);
      x += canvas.width + gap;
    }

    const link = document.createElement('a');
    link.download = `${fileNameHint}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  }, [screenshotTriggerCount, hostRef, backgroundColor, fileNameHint]);
}

// Studio Reflective Floor adaptive to Dark & Light theme
const StudioReflectiveFloor: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <group position={[0, -13.5, 0]}>
      {/* Reflective Studio Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mirror={isDark ? 0.32 : 0.35}
          mixBlur={1.0}
          mixStrength={isDark ? 1.8 : 1.6}
          roughness={isDark ? 0.24 : 0.28}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={isDark ? "#111827" : "#D2DBE8"}
          metalness={isDark ? 0.12 : 0.06}
        />
      </mesh>

      {/* Contact Ambient Occlusion Shadow */}
      <ContactShadows
        position={[0, 0.05, 0]}
        opacity={isDark ? 0.68 : 0.42}
        scale={isDark ? 70 : 65}
        blur={2.4}
        far={20}
        color={isDark ? "#000000" : "#2D3748"}
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
    studioTheme,
    upperFiles,
    lowerFiles,
    openUploadModal,
    patientName,
  } = useViewerStore();

  const isDark = studioTheme === 'dark';
  const totalFiles = upperFiles.length + lowerFiles.length;
  const hostRef = useRef<HTMLDivElement>(null);

  // Arches rarely have the same stage count (the sample case ships 25 upper against 7
  // lower), so past the shorter arch's last stage it holds its final position. Say so
  // rather than letting it look like that arch simply stopped responding.
  const upperMaxStage = useMemo(() => maxStageOf(upperFiles), [upperFiles]);
  const lowerMaxStage = useMemo(() => maxStageOf(lowerFiles), [lowerFiles]);
  const heldArches = useMemo(() => {
    const held: string[] = [];
    if (upperFiles.length > 0 && currentStep > upperMaxStage && viewMode !== 'lower') {
      held.push(`Upper held at stage ${upperMaxStage}`);
    }
    if (lowerFiles.length > 0 && currentStep > lowerMaxStage && viewMode !== 'upper') {
      held.push(`Lower held at stage ${lowerMaxStage}`);
    }
    return held;
  }, [upperFiles.length, lowerFiles.length, currentStep, upperMaxStage, lowerMaxStage, viewMode]);

  const patientSlug = useMemo(() => {
    const slug = (patientName || 'case').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug || 'case';
  }, [patientName]);

  useViewportScreenshot(
    hostRef,
    isDark ? '#0B0F19' : '#D8E0ED',
    `alignview-${patientSlug}-stage-${currentStep}`,
  );

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
    <div ref={hostRef} className={`w-full h-full relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-[#0F172A] via-[#0B0F19] to-[#080C14]' 
        : 'bg-gradient-to-b from-[#D2DAE8] via-[#DEE5F2] to-[#CBD5E6]'
    }`}>
      {isSplit ? (
        <div className={`w-full h-full grid grid-cols-2 divide-x ${
          isDark ? 'divide-slate-800' : 'divide-slate-300'
        }`}>
          {/* Split View Left: Initial / Upper */}
          <div className="relative w-full h-full">
            <div className={`absolute top-14 left-4 z-10 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold shadow-sm border ${
              isDark 
                ? 'bg-slate-900/85 text-slate-200 border-slate-700' 
                : 'bg-white/85 text-slate-700 border-slate-200/80'
            }`}>
              Stage 1 (Initial)
            </div>
            <Canvas
              shadows
              camera={{ position: [0, 1, 78], fov: 36 }}
              gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
            >
              <color attach="background" args={[isDark ? '#0F172A' : '#D8E0ED']} />
              <ambientLight intensity={isDark ? 1.1 : 1.4} />
              <directionalLight position={[18, 28, 30]} intensity={isDark ? 2.0 : 1.6} castShadow />
              <directionalLight position={[-18, 12, 20]} intensity={isDark ? 0.9 : 0.8} />
              <directionalLight position={[0, 32, -22]} intensity={isDark ? 1.1 : 0.7} color={isDark ? "#93C5FD" : "#CAD8F0"} />
              
              <DentalArchModel stage={1} totalStages={totalSteps} resolveByStage />
              <StudioReflectiveFloor isDark={isDark} />
              <CameraController />
            </Canvas>
          </div>

          {/* Split View Right: Current Stage */}
          <div className="relative w-full h-full">
            <div className={`absolute top-14 left-4 z-10 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold shadow-sm border ${
              isDark 
                ? 'bg-slate-900/85 text-sky-400 border-sky-600/40' 
                : 'bg-white/85 text-blue-700 border-blue-200'
            }`}>
              Stage {currentStep} (Current)
            </div>
            <Canvas
              shadows
              camera={{ position: [0, 1, 78], fov: 36 }}
              gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
            >
              <color attach="background" args={[isDark ? '#0B0F19' : '#D5DEEC']} />
              <ambientLight intensity={isDark ? 1.1 : 1.4} />
              <directionalLight position={[18, 28, 30]} intensity={isDark ? 2.0 : 1.6} castShadow />
              <directionalLight position={[-18, 12, 20]} intensity={isDark ? 0.9 : 0.8} />
              <directionalLight position={[0, 32, -22]} intensity={isDark ? 1.1 : 0.7} color={isDark ? "#93C5FD" : "#CAD8F0"} />
              
              <DentalArchModel stage={currentStep} totalStages={totalSteps} resolveByStage />
              <StudioReflectiveFloor isDark={isDark} />
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
          {/* Studio background matching active theme */}
          <color attach="background" args={[isDark ? '#0F172A' : '#D6DFED']} />
          
          {/* Studio Dental Lighting Setup */}
          <ambientLight intensity={isDark ? 1.15 : 1.35} />
          
          {/* Key Light for brilliant enamel highlights */}
          <directionalLight
            position={[18, 28, 32]}
            intensity={isDark ? 2.2 : 1.85}
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
          <directionalLight position={[0, 35, 10]} intensity={isDark ? 0.9 : 0.8} color="#FFFFFF" />
          {/* Rim Light for high-contrast edge definition */}
          <directionalLight position={[0, 25, -30]} intensity={isDark ? 1.1 : 0.95} color={isDark ? "#93C5FD" : "#CAD8F0"} />
          {/* Floor Bounce Light */}
          <directionalLight position={[0, -18, 15]} intensity={isDark ? 0.4 : 0.35} color={isDark ? "#CBD5E1" : "#FFFFFF"} />

          {/* Dental 3D Model with customizable color */}
          <DentalArchModel
            stage={currentStep}
            totalStages={totalSteps}
            clippingPlane={clippingPlane}
            onPointClick={handlePointClick}
          />

          {/* Measurement markers & lines */}
          <MeasurementLines />

          {/* Studio Floor with Glossy Reflection & Contact Shadow */}
          <StudioReflectiveFloor isDark={isDark} />

          {/* Camera Controller with smooth snaps */}
          <CameraController />
        </Canvas>
      )}

      {/* Arch-sequence-exhausted indicator */}
      {totalFiles > 0 && heldArches.length > 0 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border text-[10px] sm:text-[11px] font-semibold shadow-sm ${
            isDark
              ? 'bg-slate-900/85 border-amber-600/40 text-amber-300'
              : 'bg-white/90 border-amber-300 text-amber-700'
          }`}>
            <PauseCircle className="w-3 h-3 shrink-0" />
            <span>{heldArches.join(' • ')}</span>
          </div>
        </div>
      )}

      {/* Empty State / Upload Invitation Overlay */}
      {totalFiles === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-[2px] pointer-events-auto">
          <div 
            onClick={() => openUploadModal('auto')}
            className={`cursor-pointer max-w-sm sm:max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all transform hover:scale-[1.02] text-center shadow-2xl ${
              isDark 
                ? 'bg-slate-900/90 border-slate-700/90 hover:border-blue-500 text-white' 
                : 'bg-white/90 border-slate-300 hover:border-blue-500 text-slate-800'
            }`}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600/10 text-blue-500 mx-auto flex items-center justify-center mb-3 sm:mb-4 border border-blue-500/20 shadow-inner">
              <Upload className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1">No 3D Models Loaded</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Upload your Upper & Lower dental scan STL files or treatment setup sequence. Template files are automatically detected as Stage 01.
            </p>
            <button
              id="canvas-empty-upload-btn"
              onClick={(e) => {
                e.stopPropagation();
                openUploadModal('auto');
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Upload STL Files
            </button>
          </div>
        </div>
      )}

      {/* Floating FDI Tooth Identification Tooltip */}
      <ToothHoverTooltip />
    </div>
  );
};
