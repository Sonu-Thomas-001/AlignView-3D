'use client';

import React from 'react';
import { 
  Activity, 
  Ruler, 
  Layers, 
  Eye, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const BentoGridSection: React.FC = () => {
  return (
    <section id="features" className="py-10 sm:py-16 bg-slate-50/70 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/90 text-blue-800 text-xs font-bold mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>State-of-the-Art Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-slate-900 tracking-[-0.03em] leading-tight">
              Engineered for Precision Dental Diagnosis
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Everything clinicians, orthodontists, and dental labs need to inspect, simulate, and verify clear aligner biomechanics with zero setup.
            </p>
          </div>
        </ScrollReveal>

        {/* Asymmetrical Bento Grid with Staggered Scroll-Triggered Entrance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Bento Card 1: 32-Stage Aligner Morphing (Spans 2 columns) */}
          <div className="md:col-span-2">
            <ScrollReveal animation="scale-up" delay={100} className="h-full">
              <div className="h-full group relative rounded-3xl bg-white p-7 sm:p-9 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300/80 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      Orthodontic Biomechanics
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-display text-slate-900 mb-2.5 tracking-tight">
                    Continuous Multi-Stage Aligner Simulation
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
                    Simulate teeth trajectory movement across unlimited clinical treatment stages (1 to N). Observe individual tooth crown rotation, root torque, tipping corrections, and parabolic arch expansion at 60 FPS real-time interpolation.
                  </p>
                </div>

                {/* Interactive Timeline Preview Ribbon */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span className="text-slate-500">Stage 01 (Initial)</span>
                    <span className="text-blue-600 font-extrabold">Mid-Treatment (Expansion & Torque)</span>
                    <span className="text-slate-900">Stage N (Ideal Occlusion)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 relative">
                    <div className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600 rounded-full w-1/2 relative">
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-xs" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Bento Card 2: Sub-Millimeter Caliper */}
          <div>
            <ScrollReveal animation="fade-up" delay={200} className="h-full">
              <div className="h-full group relative rounded-3xl bg-white p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Ruler className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      0.01 mm Accuracy
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    Sub-Millimeter Caliper
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Click any two surface vertices to compute true 3D Euclidean distances with sub-millimeter precision for inter-canine arch width & IPR spacing.
                  </p>
                </div>

                <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Inter-Canine Width</span>
                  <span className="text-xs font-mono font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    34.28 mm
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Bento Card 3: 4 Diagnostic Shaders */}
          <div>
            <ScrollReveal animation="fade-up" delay={150} className="h-full">
              <div className="h-full group relative rounded-3xl bg-white p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-purple-300/80 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Eye className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                      Multi-Shader Suite
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    4 Diagnostic Shaders
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Inspect surface morphology and polygon density across PBR Shaded Enamel, Mesh Wireframe, Matte Clay, and Translucent X-Ray Glass.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-700">
                  <div className="p-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 text-center">PBR Enamel</div>
                  <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-center">Wireframe</div>
                  <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-center">Matte Clay</div>
                  <div className="p-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-center">X-Ray Glass</div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Bento Card 4: Multi-Axis Slicing Planes */}
          <div>
            <ScrollReveal animation="fade-up" delay={250} className="h-full">
              <div className="h-full group relative rounded-3xl bg-white p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-300/80 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                      Cross-Section View
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    Cross-Section Clipping
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Dynamic X, Y, and Z clipping planes reveal internal tooth crown wall thicknesses, occlusal contact depths, and root canal cavities.
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-100/80 text-amber-900 text-xs font-bold border border-amber-200">X-Axis</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">Y-Axis</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">Z-Axis</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Bento Card 5: 100% Client-Side Privacy */}
          <div>
            <ScrollReveal animation="fade-up" delay={350} className="h-full">
              <div className="h-full group relative rounded-3xl bg-white p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300/80 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      HIPAA & GDPR Safe
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    Zero Cloud Uploads
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    All patient scan files (.stl) are parsed 100% locally in browser memory via client-side Web Workers. No sensitive data ever leaves your computer.
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    RAM Sandboxed
                  </span>
                  <span className="font-extrabold text-blue-600 text-xs">100% Private</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>

        {/* Bottom CTA Link */}
        <ScrollReveal animation="fade-up" delay={200}>
          <div className="mt-10 text-center">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 group px-6 py-2.5 rounded-full bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <span>Experience all capabilities in the Live 3D Studio</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
};
