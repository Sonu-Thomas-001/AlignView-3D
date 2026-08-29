'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/header/Header';
import { ArchSidebar } from '@/components/sidebar/ArchSidebar';
import { FloatingToolPalette } from '@/components/viewport/FloatingToolPalette';
import { ViewModePill } from '@/components/viewport/ViewModePill';
import { ViewCubeGizmo } from '@/components/viewport/ViewCubeGizmo';
import { RenderModePill } from '@/components/viewport/RenderModePill';
import { ModelStatsCard } from '@/components/viewport/ModelStatsCard';
import { SectionSlider } from '@/components/viewport/SectionSlider';
import { MeasurementOverlay } from '@/components/viewport/MeasurementOverlay';
import { TimelinePlayback } from '@/components/timeline/TimelinePlayback';
import { UploadModal } from '@/components/modals/UploadModal';
import { useViewerStore } from '@/store/useViewerStore';

// Dynamically load 3D Canvas on client only to avoid SSR issues
const DentalCanvas = dynamic(
  () => import('@/components/viewport/DentalCanvas').then((mod) => mod.DentalCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#D8E0ED] gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Initializing 3D Dental Engine...</span>
      </div>
    ),
  }
);

export default function STLStudioPage() {
  const { activeMobileDrawer, setActiveMobileDrawer } = useViewerStore();

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-[#F4F6FA] select-none font-sans">
      {/* 1. Top Navigation & Action Header */}
      <Header />

      {/* 2. Main Content Layout (Responsive 3-Column on lg+, Full-Width 3D Canvas on mobile/tablet) */}
      <div className="flex-1 flex overflow-hidden relative p-2 sm:p-3 gap-2 sm:gap-3">
        {/* Left Column: Upper Arch File Sequence List (Desktop) */}
        <div className="hidden lg:flex rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm shrink-0 h-full bg-white">
          <ArchSidebar arch="upper" />
        </div>

        {/* Center Column: 3D Dental Viewport (Top) + Timeline Playback (Bottom) */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-3 h-full overflow-hidden min-w-0">
          {/* 3D Dental Viewport Card */}
          <div className="flex-1 relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-card bg-gradient-to-b from-[#D4DCF0] via-[#E2E8F4] to-[#CDD7EA]">
            {/* Main Three.js Canvas */}
            <DentalCanvas />

            {/* Top Floating View Mode Pill (Both Arches / Upper / Lower / Split) */}
            <ViewModePill />

            {/* Top Right Floating 3D View Cube Gizmo (U / D / L / R / F) */}
            <ViewCubeGizmo />

            {/* Left Floating Tool Palette (Move, Rotate, Zoom, Pan, Measure, Section) */}
            <FloatingToolPalette />

            {/* Interactive Tool Floating Panels */}
            <SectionSlider />
            <MeasurementOverlay />

            {/* Bottom Left Model Telemetry Card (Vertices, Triangles, Size) */}
            <ModelStatsCard />

            {/* Bottom Right Render Mode Switcher (Shaded, Wireframe, Solid, X-Ray) */}
            <RenderModePill />
          </div>

          {/* Bottom Timeline & Playback Card in Center Column */}
          <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm shrink-0">
            <TimelinePlayback />
          </div>
        </div>

        {/* Right Column: Lower Arch File Sequence List (Desktop) */}
        <div className="hidden lg:flex rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm shrink-0 h-full bg-white">
          <ArchSidebar arch="lower" />
        </div>
      </div>

      {/* Responsive Slide-over Drawer for Mobile / Tablet (< lg) */}
      {activeMobileDrawer && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={() => setActiveMobileDrawer(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
          />

          {/* Drawer Panel */}
          <div className={`relative w-4/5 max-w-sm h-full bg-white shadow-2xl z-50 animate-in duration-200 ${
            activeMobileDrawer === 'upper' 
              ? 'slide-in-from-left' 
              : 'slide-in-from-right ml-auto'
          }`}>
            <ArchSidebar 
              arch={activeMobileDrawer} 
              isMobileDrawer 
              onCloseMobileDrawer={() => setActiveMobileDrawer(null)} 
            />
          </div>
        </div>
      )}

      {/* Custom STL Upload Modal */}
      <UploadModal />
    </main>
  );
}
