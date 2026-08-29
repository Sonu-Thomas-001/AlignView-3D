'use client';

import React from 'react';
import dynamic from 'next/dynamic';
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

// Dynamically load 3D Canvas on client only to avoid SSR issues
const DentalCanvas = dynamic(
  () => import('@/components/viewport/DentalCanvas').then((mod) => mod.DentalCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#E8EEF6] gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Initializing 3D Dental Engine...</span>
      </div>
    ),
  }
);

export default function STLPreviewerPage() {
  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-[#F4F6FA] select-none font-sans">
      {/* 1. Top Navigation & Action Header */}
      <Header />

      {/* 2. Main Content 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative p-3 gap-3">
        {/* Left Column: Upper Arch File Sequence List */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex shrink-0">
          <ArchSidebar arch="upper" />
        </div>

        {/* Center Column: 3D Dental Viewport & Overlays with rounded corners */}
        <div className="flex-1 h-full relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-card bg-gradient-to-b from-[#D4DCF0] via-[#E2E8F4] to-[#CDD7EA]">
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

        {/* Right Column: Lower Arch File Sequence List */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex shrink-0">
          <ArchSidebar arch="lower" />
        </div>
      </div>

      {/* 3. Bottom Timeline & Playback Sequence Bar */}
      <TimelinePlayback />

      {/* 4. Custom STL Upload Modal */}
      <UploadModal />
    </main>
  );
}
