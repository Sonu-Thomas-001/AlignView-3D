'use client';

import React, { useState } from 'react';
import { Sparkles, MoveHorizontal, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const BeforeAfterSection: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <section className="py-24 sm:py-32 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-time Biomechanical Transformation</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Before & After Aligner Alignment
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Drag the comparison slider below to inspect the tooth trajectory progression from Stage 1 (Initial Crowding) to Stage 32 (Ideal Occlusion).
          </p>
        </div>

        {/* Interactive Comparison Slider Container */}
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl aspect-[16/9] select-none">
            
            {/* 1. Stage 32 - Final Perfect Smile (Underneath layer) */}
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
              <div className="text-center max-w-md">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-3">
                  Stage 32 • Ideal Arch Alignment
                </span>
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-2">Perfect Arch Contour</h4>
                <p className="text-xs sm:text-sm text-slate-400">
                  Canine guidance restored, smooth anterior arch curvature, zero crowding, and symmetric contact points.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Class I Occlusion Achieved</span>
                </div>
              </div>
            </div>

            {/* 2. Stage 1 - Initial Crowded Smile (Clipped Top Layer) */}
            <div 
              className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 border-r-2 border-blue-400 shadow-2xl"
              style={{ width: `${sliderPosition}%`, overflow: 'hidden' }}
            >
              <div className="text-center max-w-md w-[80vw] sm:w-[400px]">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold mb-3">
                  Stage 01 • Initial Crowded Arch
                </span>
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-2">Severe Anterior Crowding</h4>
                <p className="text-xs sm:text-sm text-slate-400">
                  Labial tipping on central incisors, rotated lateral incisors, and constricted bicuspid width.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <span>Target Overjet: +2.4 mm</span>
                </div>
              </div>
            </div>

            {/* Slider Center Line & Draggable Handle */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize pointer-events-none z-20 shadow-lg"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
                <MoveHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Invisible native range slider covering the area for smooth drag */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderChange}
              className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
              aria-label="Before and after slider"
            />
          </div>

          {/* Interactive instruction note */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
            <span>← Stage 01 (Initial)</span>
            <span className="font-semibold text-blue-400">Drag slider left/right to compare</span>
            <span>Stage 32 (Complete) →</span>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
          >
            <span>Inspect All 32 Stages in 3D Studio</span>
          </Link>
        </div>

      </div>
    </section>
  );
};
