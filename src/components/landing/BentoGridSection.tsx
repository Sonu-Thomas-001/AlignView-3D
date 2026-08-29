'use client';

import React from 'react';
import { 
  Activity, 
  Ruler, 
  Layers, 
  Eye, 
  Zap, 
  UploadCloud, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';
import Link from 'next/link';

export const BentoGridSection: React.FC = () => {
  return (
    <section id="features" className="py-24 sm:py-32 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>State-of-the-Art Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Precision Dental Diagnosis
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Everything clinicians, orthodontists, and dental labs need to inspect and simulate aligner biomechanics with zero setup.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Card 1: 32-Stage Aligner Morphing (Large 2-column card) */}
          <div className="md:col-span-2 group relative rounded-3xl bg-white p-8 sm:p-10 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Orthodontic Sequence</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 mb-4">
                Continuous 32-Stage Aligner Morphing
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Simulate teeth movement dynamically across all treatment steps. Observe rotational torque, tipping, and arch expansion in fluid 60 FPS real-time interpolation.
              </p>
            </div>

            {/* Visual Mini Graphic */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Stage 1 (Crowded)</span>
                <span className="text-blue-600 font-bold">Stage 16 (Mid-Treatment)</span>
                <span>Stage 32 (Perfect Smile)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 relative">
                <div className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-600 rounded-full w-1/2" />
              </div>
            </div>
          </div>

          {/* Bento Card 2: Caliper Measurement */}
          <div className="group relative rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-sm">
                <Ruler className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Clinical Accuracy</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                Sub-Millimeter Caliper
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Click any two surface vertices to compute true 3D Euclidean distances with 0.01 mm precision for arch width & interproximal spacing.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Inter-Canine Width</span>
              <span className="text-xs font-bold font-mono text-emerald-700">34.28 mm</span>
            </div>
          </div>

          {/* Bento Card 3: 4 Shaders Diagnostic Suite */}
          <div className="group relative rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 shadow-sm">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Diagnostic Modes</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                4 Specialized Shaders
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Toggle between PBR Enamel Shading, Mesh Wireframe Topology, Matte Studio Clay, and Translucent Holographic X-Ray.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 text-center">PBR Shaded</div>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 text-center">Wireframe</div>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 text-center">Matte Clay</div>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700 text-center">X-Ray Glass</div>
            </div>
          </div>

          {/* Bento Card 4: Dynamic Cross-Section Slicing */}
          <div className="group relative rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Internal Slicing</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                Cross-Section Planes
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Dynamic X, Y, and Z clipping planes reveal internal tooth crown walls, occlusal contact depths, and root canal cavities.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">X Axis</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Y Axis</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Z Axis</span>
            </div>
          </div>

          {/* Bento Card 5: Zero-Install WebGL & Instant Ingestion */}
          <div className="group relative rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Zero Setup</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                Zero Install & 60 FPS
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Powered by Next.js 16 and Three.js with hardware-accelerated WebGL. Drag & drop any `.stl` file for instant client-side rendering.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Client-Side Security</span>
              <span className="font-bold text-blue-600">100% Private</span>
            </div>
          </div>

        </div>

        {/* Bottom Callout */}
        <div className="mt-12 text-center">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 group"
          >
            <span>Experience all capabilities in the Live 3D Studio</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
