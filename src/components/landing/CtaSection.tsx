'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const CtaSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 bg-slate-950 text-white relative overflow-hidden">
      {/* Dynamic Background Flare Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <ScrollReveal animation="scale-up">
          <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-7 sm:p-12 lg:p-14 shadow-2xl backdrop-blur-xl overflow-hidden">
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-4 sm:mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Web Access • No Registration Required</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display tracking-[-0.03em] leading-tight">
                Ready to Experience Precision Dental 3D in Your Browser?
              </h2>

              <p className="mt-3.5 text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                Open your dental STL files right now with continuous multi-stage treatment morphing, sub-millimeter measurements, and studio lighting.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  href="/studio"
                  className="group px-7 py-3.5 text-xs sm:text-sm font-extrabold text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-full transition-all shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <span>Launch 3D Studio Now</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-blue-600" />
                </Link>

                <a
                  href="#features"
                  className="px-6 py-3.5 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-full transition-all flex items-center gap-2"
                >
                  <span>Explore Feature Suite</span>
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Client-Side Privacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Hardware Accelerated 60 FPS</span>
                </div>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
