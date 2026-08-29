'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Pause, 
  Layers, 
  Ruler, 
  Eye, 
  Zap, 
  CheckCircle2,
  Activity,
  ShieldCheck,
  RotateCw,
  Box,
  Columns2
} from 'lucide-react';

const STAGES = [
  { stage: 1, name: 'Stage 01: Initial Crowded Occlusion', overjet: '+3.4 mm', progress: 5 },
  { stage: 8, name: 'Stage 08: Anterior De-rotation & Torque', overjet: '+2.8 mm', progress: 25 },
  { stage: 16, name: 'Stage 16: Transverse Arch Expansion', overjet: '+2.2 mm', progress: 50 },
  { stage: 24, name: 'Stage 24: Canine Guidance Restoration', overjet: '+1.8 mm', progress: 75 },
  { stage: 32, name: 'Stage 32: Ideal Class I Hollywood Smile', overjet: '+1.5 mm', progress: 100 },
];

export const HeroSection: React.FC = () => {
  const [currentStageIdx, setCurrentStageIdx] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedView, setSelectedView] = useState<'both' | 'upper' | 'lower' | 'split'>('both');
  const [selectedShader, setSelectedShader] = useState<'shaded' | 'wireframe' | 'xray'>('shaded');

  // Automated playback sequence
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStageIdx((prev) => (prev + 1) % STAGES.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const activeStage = STAGES[currentStageIdx];

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/80 via-slate-50/60 to-white">
      {/* Background Decorative Mesh Grids & Multi-Color Glow Flares */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1100px] h-[450px] bg-gradient-to-tr from-blue-500/20 via-sky-400/20 to-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute top-1/3 left-6 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute top-1/2 right-6 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-reverse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Top Product Release Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-blue-200/90 shadow-sm text-slate-800 text-xs font-semibold mb-6 hover:border-blue-400 hover:shadow-md transition-all cursor-default animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span className="font-bold text-blue-600">AlignView 3D</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">WebGL 2.0 Orthodontic Engine</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase ml-1">v1.0</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Precision 3D Dental Modeling{' '}
          <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer inline-block">
            at the Speed of Web.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
          Inspect clinical STL arches, simulate continuous 32-stage orthodontic treatment trajectories, and perform sub-millimeter caliper measurements directly in your browser.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/studio"
            className="group relative px-8 py-4 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 flex items-center gap-2.5 transform hover:-translate-y-1 overflow-hidden"
          >
            {/* Shimmering button highlight */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative z-10">Launch Live 3D Studio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
          </Link>

          <a
            href="#features"
            className="px-7 py-4 text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            Explore Features
          </a>
        </div>

        {/* Trust Proof Ribbon */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero Install / Pure WebGL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>32-Stage Aligner Trajectory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Sub-Millimeter Caliper</span>
          </div>
        </div>

        {/* Interactive Studio Device Showcase Frame */}
        <div className="mt-14 sm:mt-16 relative max-w-5xl mx-auto">
          
          {/* Glassmorphic Studio Card */}
          <div className="relative rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-slate-200/90 via-slate-100/60 to-slate-200/90 shadow-2xl border border-white/90">
            
            {/* Inner Viewport Display */}
            <div className={`relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[16/10] border border-slate-300/60 shadow-inner flex flex-col justify-between p-4 sm:p-6 transition-all duration-500 ${
              selectedShader === 'wireframe' 
                ? 'bg-slate-900 text-white' 
                : selectedShader === 'xray'
                ? 'bg-gradient-to-b from-sky-950 via-slate-900 to-sky-950 text-white'
                : 'bg-gradient-to-b from-[#D2DAE8] via-[#DEE5F2] to-[#CBD5E6] text-slate-800'
            }`}>
              
              {/* Studio Top Control Overlay */}
              <div className="flex items-center justify-between z-10">
                {/* View Mode Switcher */}
                <div className="mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-md border border-slate-200/80 p-1 flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => setSelectedView('both')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      selectedView === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                    }`}
                  >
                    Both Arches
                  </button>
                  <button
                    onClick={() => setSelectedView('upper')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      selectedView === 'upper' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                    }`}
                  >
                    Upper Only
                  </button>
                  <button
                    onClick={() => setSelectedView('lower')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      selectedView === 'lower' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                    }`}
                  >
                    Lower Only
                  </button>
                  <button
                    onClick={() => setSelectedView('split')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      selectedView === 'split' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                    }`}
                  >
                    Split View
                  </button>
                </div>

                {/* 3D View Cube Gizmo Mock */}
                <div className="absolute top-4 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 shadow-gizmo border border-slate-200/80 flex items-center justify-center">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shadow">
                    F
                  </div>
                </div>
              </div>

              {/* Center Dental Arch Graphic Illustration */}
              <div className="relative flex-1 flex items-center justify-center my-2 select-none">
                
                {/* Live Laser Caliper Ray Overlay */}
                <div className="absolute z-20 flex flex-col items-center pointer-events-none transform -translate-y-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-400/40 animate-ping" />
                    <div className="h-0.5 w-28 sm:w-40 bg-blue-600 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/80 animate-scan" />
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-400/40 animate-ping" />
                  </div>
                  <span className="mt-1 px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-mono font-bold shadow-md">
                    34.28 mm • Sub-mm Accuracy
                  </span>
                </div>

                {/* Dynamic Dental Arch SVG */}
                <div className="relative w-72 sm:w-[420px] drop-shadow-2xl transition-all duration-700">
                  <svg viewBox="0 0 400 240" className="w-full h-auto">
                    <defs>
                      <linearGradient id="heroGumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={selectedShader === 'xray' ? '#EC4899' : '#E47585'} />
                        <stop offset="100%" stopColor={selectedShader === 'xray' ? '#BE185D' : '#C95B6C'} />
                      </linearGradient>
                      <linearGradient id="heroToothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={selectedShader === 'xray' ? '#93C5FD' : '#FFFFFF'} />
                        <stop offset="70%" stopColor={selectedShader === 'xray' ? '#60A5FA' : '#F8FAFC'} />
                        <stop offset="100%" stopColor={selectedShader === 'xray' ? '#3B82F6' : '#E2E8F0'} />
                      </linearGradient>
                      <filter id="heroToothGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.18" />
                      </filter>
                    </defs>

                    {/* Floor Reflection shadow */}
                    <ellipse cx="200" cy="225" rx="160" ry="12" fill="#2D3748" opacity={selectedShader === 'wireframe' ? '0.05' : '0.18'} />

                    {/* Upper Arch (visible if 'both', 'upper', or 'split') */}
                    {selectedView !== 'lower' && (
                      <g className="transition-opacity duration-300">
                        {/* Upper Gingiva / Gum */}
                        <path
                          d="M 50 100 C 50 40 350 40 350 100 C 320 95 290 85 200 85 C 110 85 80 95 50 100 Z"
                          fill="url(#heroGumGrad)"
                          stroke={selectedShader === 'wireframe' ? '#38BDF8' : 'none'}
                          strokeWidth={selectedShader === 'wireframe' ? '1.5' : '0'}
                          filter="url(#heroToothGlow)"
                          opacity={selectedShader === 'xray' ? '0.65' : '1'}
                        />
                        
                        {/* Upper Teeth Arch (14 anatomical crowns) */}
                        <g 
                          fill={selectedShader === 'wireframe' ? 'none' : 'url(#heroToothGrad)'} 
                          stroke={selectedShader === 'wireframe' ? '#60A5FA' : '#CBD5E1'} 
                          strokeWidth={selectedShader === 'wireframe' ? '1.5' : '1.2'} 
                          filter="url(#heroToothGlow)"
                          opacity={selectedShader === 'xray' ? '0.75' : '1'}
                        >
                          <path d="M 60 95 C 60 115 80 115 80 95 Z" />
                          <path d="M 82 92 C 82 118 105 118 105 92 Z" />
                          <path d="M 108 90 C 108 122 130 122 130 90 Z" />
                          <path d="M 133 88 C 133 125 155 125 155 88 Z" />
                          <path d="M 158 87 C 158 132 178 132 178 87 Z" />
                          <path d="M 180 86 C 180 138 200 138 200 86 Z" />
                          <path d="M 202 86 C 202 138 222 138 222 86 Z" />
                          <path d="M 224 87 C 224 132 244 132 244 87 Z" />
                          <path d="M 247 88 C 247 125 269 125 269 88 Z" />
                          <path d="M 272 90 C 272 122 294 122 294 90 Z" />
                          <path d="M 297 92 C 297 118 320 118 320 92 Z" />
                          <path d="M 322 95 C 322 115 342 115 342 95 Z" />
                        </g>
                      </g>
                    )}

                    {/* Lower Arch (visible if 'both', 'lower', or 'split') */}
                    {selectedView !== 'upper' && (
                      <g className="transition-opacity duration-300">
                        {/* Lower Teeth Arch */}
                        <g 
                          fill={selectedShader === 'wireframe' ? 'none' : 'url(#heroToothGrad)'} 
                          stroke={selectedShader === 'wireframe' ? '#60A5FA' : '#CBD5E1'} 
                          strokeWidth={selectedShader === 'wireframe' ? '1.5' : '1.2'} 
                          filter="url(#heroToothGlow)"
                          opacity={selectedShader === 'xray' ? '0.75' : '1'}
                        >
                          <path d="M 70 145 C 70 125 90 125 90 145 Z" />
                          <path d="M 92 145 C 92 122 115 122 115 145 Z" />
                          <path d="M 118 145 C 118 118 140 118 140 145 Z" />
                          <path d="M 143 145 C 143 115 165 115 165 145 Z" />
                          <path d="M 168 145 C 168 112 188 112 188 145 Z" />
                          <path d="M 190 145 C 190 108 210 108 210 145 Z" />
                          <path d="M 212 145 C 212 108 232 108 232 145 Z" />
                          <path d="M 234 145 C 234 112 254 112 254 145 Z" />
                          <path d="M 257 145 C 257 115 279 115 279 145 Z" />
                          <path d="M 282 145 C 282 118 304 118 304 145 Z" />
                          <path d="M 307 145 C 307 122 330 122 330 145 Z" />
                        </g>

                        {/* Lower Gingiva / Gum */}
                        <path
                          d="M 50 140 C 50 200 350 200 350 140 C 320 145 290 155 200 155 C 110 155 80 145 50 140 Z"
                          fill="url(#heroGumGrad)"
                          stroke={selectedShader === 'wireframe' ? '#38BDF8' : 'none'}
                          strokeWidth={selectedShader === 'wireframe' ? '1.5' : '0'}
                          filter="url(#heroToothGlow)"
                          opacity={selectedShader === 'xray' ? '0.65' : '1'}
                        />
                      </g>
                    )}
                  </svg>
                </div>

                {/* Left Floating Tool Palette */}
                <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex flex-col gap-1 text-[10px] font-semibold text-slate-700">
                  <div className="p-1.5 rounded-lg bg-blue-600 text-white flex flex-col items-center">Move</div>
                  <div className="p-1.5 rounded-lg hover:bg-slate-100 flex flex-col items-center">Rotate</div>
                  <div className="p-1.5 rounded-lg hover:bg-slate-100 flex flex-col items-center">Zoom</div>
                  <div className="p-1.5 rounded-lg hover:bg-slate-100 flex flex-col items-center">Measure</div>
                </div>

                {/* Bottom Left Model Telemetry Card */}
                <div className="absolute bottom-2 left-2 sm:left-4 bg-white/90 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-md border border-slate-200 text-[10px] text-slate-600 flex flex-col gap-0.5 text-left">
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Vertices</span><span className="font-bold text-slate-800">328,654</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Triangles</span><span className="font-bold text-slate-800">657,302</span></div>
                </div>

                {/* Bottom Right Shader Selector */}
                <div className="absolute bottom-2 right-2 sm:right-4 bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex items-center gap-1 text-[10px] font-semibold text-slate-700">
                  <button
                    onClick={() => setSelectedShader('shaded')}
                    className={`px-2 py-0.5 rounded-lg transition-colors ${
                      selectedShader === 'shaded' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    Shaded
                  </button>
                  <button
                    onClick={() => setSelectedShader('wireframe')}
                    className={`px-2 py-0.5 rounded-lg transition-colors ${
                      selectedShader === 'wireframe' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    Wireframe
                  </button>
                  <button
                    onClick={() => setSelectedShader('xray')}
                    className={`px-2 py-0.5 rounded-lg transition-colors ${
                      selectedShader === 'xray' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    X-Ray
                  </button>
                </div>
              </div>

              {/* Bottom Playback Timeline Scrubber */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 sm:p-3 shadow-md border border-slate-200/80 flex items-center justify-between gap-4 text-xs z-10">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-all transform active:scale-95"
                    title={isPlaying ? "Pause Simulation" : "Play Sequence"}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white stroke-none" /> : <Play className="w-3.5 h-3.5 fill-white stroke-none ml-0.5" />}
                  </button>
                  <span className="font-bold text-slate-800 text-[11px] hidden xs:inline">Playback</span>
                </div>

                {/* Animated Sequence Progress */}
                <div className="flex-1 flex flex-col gap-1 max-w-md">
                  <div className="flex justify-between text-[10px] font-bold text-slate-700">
                    <span className="text-blue-600 font-extrabold">{activeStage.name}</span>
                    <span className="tabular-nums">Stage {activeStage.stage} / 32</span>
                  </div>
                  <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${activeStage.progress}%` }}
                    />
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-700">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">1.0x Speed</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100">Loop On</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating HUD Holographic Badges */}
          <div className="absolute -bottom-6 -left-3 sm:-left-6 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3.5 flex items-center gap-3 animate-float hidden sm:flex">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-inner">
              <Ruler className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">Sub-Millimeter Caliper</p>
              <p className="text-[11px] text-slate-500">Live 3D point-to-point measurement</p>
            </div>
          </div>

          <div className="absolute -top-6 -right-3 sm:-right-6 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3.5 flex items-center gap-3 animate-float-reverse hidden sm:flex">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">32 Treatment Stages</p>
              <p className="text-[11px] text-slate-500">Continuous aligner morphing sequence</p>
            </div>
          </div>

          <div className="absolute -bottom-6 right-8 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3 flex items-center gap-2.5 animate-float-slow hidden md:flex">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">60 FPS WebGL Engine</p>
              <p className="text-[10px] text-slate-400">Zero install • Pure browser</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
