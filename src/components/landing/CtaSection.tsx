'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Github, ShieldCheck, Zap } from 'lucide-react';

export const CtaSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 sm:p-16 text-center text-white shadow-2xl border border-slate-800 overflow-hidden">
          
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Web Access • No Registration Required</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to Experience Precision Dental 3D in Your Browser?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Open your dental STL files right now with continuous 32-stage treatment morphing, sub-millimeter measurements, and studio lighting.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/studio"
                className="group px-8 py-4 text-sm sm:text-base font-extrabold text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-full transition-all shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <span>Launch 3D Studio Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-blue-600" />
              </Link>

              <a
                href="https://github.com/Sonu-Thomas-001/AlignView-3D"
                target="_blank"
                rel="noreferrer"
                className="px-7 py-4 text-sm sm:text-base font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-full transition-all flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>View on GitHub</span>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
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
      </div>
    </section>
  );
};
