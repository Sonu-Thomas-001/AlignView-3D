'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Ruler, 
  Eye, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Activity,
  Cpu,
  Smartphone
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32 overflow-hidden bg-gradient-to-b from-blue-50/80 via-slate-50/60 to-white">
      {/* Background Subtle Mesh Grids & Ambient Glow Flares */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1100px] h-[450px] bg-gradient-to-tr from-blue-500/20 via-sky-400/20 to-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute top-1/3 left-6 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute top-1/2 right-6 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-reverse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Top Product Release Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-blue-200/90 shadow-sm text-slate-800 text-xs font-semibold mb-8 hover:border-blue-400 hover:shadow-md transition-all cursor-default animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span className="font-bold text-blue-600">AlignView 3D</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">WebGL 2.0 Orthodontic Engine</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase ml-1">v1.0</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.12] max-w-5xl mx-auto">
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
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/studio"
            className="group relative px-9 py-4 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 flex items-center gap-2.5 transform hover:-translate-y-1 overflow-hidden"
          >
            {/* Shimmering button highlight */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative z-10">Launch Live 3D Studio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
          </Link>

          <a
            href="#features"
            className="px-8 py-4 text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            Explore Features
          </a>
        </div>

        {/* Trust Proof Ribbon */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-medium text-slate-600">
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
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Client-Side Privacy</span>
          </div>
        </div>

      </div>
    </section>
  );
};
