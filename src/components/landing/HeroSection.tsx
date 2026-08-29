'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Layers, 
  Ruler, 
  Eye, 
  Zap, 
  CheckCircle,
  ShieldCheck
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50 to-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-gradient-to-tr from-blue-400/20 via-sky-300/20 to-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Product Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200/80 text-blue-800 text-xs font-semibold shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Next-Generation Clear Aligner Visualizer</span>
        </div>

        {/* Hero Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Precision 3D Dental Modeling{' '}
          <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
            at the Speed of Web.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Inspect clinical STL arches, simulate continuous 32-stage orthodontic treatment trajectories, and perform sub-millimeter caliper measurements directly in your browser.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/studio"
            className="group px-7 py-3.5 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <span>Launch Live 3D Studio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <a
            href="#features"
            className="px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-full transition-all shadow-sm hover:shadow-md"
          >
            Explore Features
          </a>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Zero Install / Pure WebGL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>32-Stage Aligner Trajectory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Sub-Millimeter Caliper</span>
          </div>
        </div>

        {/* High-Fidelity UI Interface Showcase */}
        <div className="mt-14 sm:mt-18 relative max-w-5xl mx-auto">
          {/* Outer Glow & Shadow Container */}
          <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-200/80 via-slate-100/50 to-slate-200/80 shadow-2xl border border-white/80">
            {/* Inner Studio Frame */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#D4DCF0] via-[#E2E8F4] to-[#CDD7EA] aspect-[16/9] sm:aspect-[16/10] border border-slate-300/60 shadow-inner flex flex-col justify-between p-4 sm:p-6">
              
              {/* Studio Header Mock */}
              <div className="flex items-center justify-between z-10">
                {/* Top View Mode Pill Mock */}
                <div className="mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-md border border-slate-200/80 px-3 py-1.5 flex items-center gap-2 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white">Both Arches</span>
                  <span className="text-slate-600 px-2">Upper Only</span>
                  <span className="text-slate-600 px-2">Lower Only</span>
                  <span className="text-slate-600 px-2">Split View</span>
                </div>

                {/* View Cube Gizmo Mock */}
                <div className="absolute top-4 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 shadow-gizmo border border-slate-200/80 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">F</div>
                </div>
              </div>

              {/* Center Dental Arch Graphic Illustration */}
              <div className="relative flex-1 flex items-center justify-center my-2">
                {/* Visual Dental Arch SVG with smooth lighting */}
                <div className="relative w-72 sm:w-96 drop-shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <svg viewBox="0 0 400 240" className="w-full h-auto">
                    <defs>
                      <linearGradient id="gumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#E47585" />
                        <stop offset="100%" stopColor="#C95B6C" />
                      </linearGradient>
                      <linearGradient id="toothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="70%" stopColor="#F8FAFC" />
                        <stop offset="100%" stopColor="#E2E8F0" />
                      </linearGradient>
                      <filter id="toothGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.15" />
                      </filter>
                    </defs>

                    {/* Floor Reflection shadow */}
                    <ellipse cx="200" cy="225" rx="160" ry="12" fill="#2D3748" opacity="0.18" />

                    {/* Upper Gingiva / Gum */}
                    <path
                      d="M 50 100 C 50 40 350 40 350 100 C 320 95 290 85 200 85 C 110 85 80 95 50 100 Z"
                      fill="url(#gumGrad)"
                      filter="url(#toothGlow)"
                    />
                    
                    {/* Upper Teeth Arch (14 anatomical crowns) */}
                    <g fill="url(#toothGrad)" stroke="#CBD5E1" strokeWidth="1.2" filter="url(#toothGlow)">
                      {/* Left Molars & Premolars */}
                      <path d="M 60 95 C 60 115 80 115 80 95 Z" />
                      <path d="M 82 92 C 82 118 105 118 105 92 Z" />
                      <path d="M 108 90 C 108 122 130 122 130 90 Z" />
                      <path d="M 133 88 C 133 125 155 125 155 88 Z" />
                      {/* Canines */}
                      <path d="M 158 87 C 158 132 178 132 178 87 Z" />
                      {/* Central & Lateral Incisors */}
                      <path d="M 180 86 C 180 138 200 138 200 86 Z" />
                      <path d="M 202 86 C 202 138 222 138 222 86 Z" />
                      <path d="M 224 87 C 224 132 244 132 244 87 Z" />
                      {/* Right Premolars & Molars */}
                      <path d="M 247 88 C 247 125 269 125 269 88 Z" />
                      <path d="M 272 90 C 272 122 294 122 294 90 Z" />
                      <path d="M 297 92 C 297 118 320 118 320 92 Z" />
                      <path d="M 322 95 C 322 115 342 115 342 95 Z" />
                    </g>

                    {/* Lower Teeth Arch */}
                    <g fill="url(#toothGrad)" stroke="#CBD5E1" strokeWidth="1.2" filter="url(#toothGlow)">
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
                      fill="url(#gumGrad)"
                      filter="url(#toothGlow)"
                    />
                  </svg>
                </div>

                {/* Left Floating Tool Palette Mock */}
                <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex flex-col gap-1 text-[10px] font-semibold text-slate-700">
                  <div className="p-1.5 rounded-lg bg-blue-600 text-white flex flex-col items-center">Move</div>
                  <div className="p-1.5 rounded-lg hover:bg-slate-100 flex flex-col items-center">Rotate</div>
                  <div className="p-1.5 rounded-lg hover:bg-slate-100 flex flex-col items-center">Zoom</div>
                  <div className="p-1.5 rounded-lg hover:bg-slate-100 flex flex-col items-center">Measure</div>
                </div>

                {/* Bottom Left Telemetry Card Mock */}
                <div className="absolute bottom-2 left-2 sm:left-4 bg-white/90 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-md border border-slate-200 text-[10px] text-slate-600 flex flex-col gap-0.5 text-left">
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Vertices</span><span className="font-bold text-slate-800">328,654</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Triangles</span><span className="font-bold text-slate-800">657,302</span></div>
                </div>

                {/* Bottom Right Shader Pill Mock */}
                <div className="absolute bottom-2 right-2 sm:right-4 bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex items-center gap-1 text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white">Shaded</span>
                  <span className="px-2 py-0.5 text-slate-600">Wireframe</span>
                  <span className="px-2 py-0.5 text-slate-600">X-Ray</span>
                </div>
              </div>

              {/* Bottom Playback Timeline Bar Mock */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 sm:p-3 shadow-md border border-slate-200/80 flex items-center justify-between gap-4 text-xs z-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-[11px]">Playback</span>
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1 max-w-md">
                  <div className="flex justify-between text-[10px] font-bold text-slate-700">
                    <span>File Sequence</span>
                    <span>Stage 8 / 32</span>
                  </div>
                  <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full w-1/4" />
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-700">
                  <span>Speed: 1.0x</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100">Loop On</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Feature Badges */}
          <div className="absolute -bottom-5 -left-3 sm:-left-6 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3.5 flex items-center gap-3 animate-bounce duration-1000 hidden sm:flex">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Ruler className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">Sub-Millimeter Caliper</p>
              <p className="text-[11px] text-slate-500">Live 3D point-to-point measurement</p>
            </div>
          </div>

          <div className="absolute -top-5 -right-3 sm:-right-6 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3.5 flex items-center gap-3 hidden sm:flex">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">32 Treatment Stages</p>
              <p className="text-[11px] text-slate-500">Continuous aligner morphing sequence</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
