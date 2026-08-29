'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Github, 
  ArrowUp, 
  Sparkles, 
  Layers, 
  Ruler, 
  Eye, 
  Activity, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const AppLogoTooth = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#3B82F6" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="w-7 h-7"
  >
    <path d="M12 3C8.5 3 6 5 6 8.5c0 4 2 6 2.5 10 .5 4 3 4.5 3.5 4.5s3-.5 3.5-4.5c.5-4 2.5-6 2.5-10C18 5 15.5 3 12 3z" />
    <path d="M12 3v5" />
  </svg>
);

export const LandingFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 relative overflow-hidden text-xs sm:text-sm">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-96 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        
        {/* Pre-Footer Action Ribbon */}
        <div className="mb-16 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-md">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Ready to inspect your dental STL models?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Launch the studio now — zero installation, zero lag, 100% free and open-source.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/studio"
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Open 3D Studio →
            </Link>
            <a
              href="https://github.com/Sonu-Thomas-001/AlignView-3D"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/80"
              title="Star on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 4-Column Structured Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12 mb-16">
          
          {/* Col 1 & 2: Brand Identity & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-500/30 group-hover:border-blue-400 transition-colors shadow-inner flex items-center justify-center">
                <AppLogoTooth />
              </div>
              <div>
                <span className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  AlignView <span className="text-blue-500">3D</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Dental Visualization Engine
                </span>
              </div>
            </Link>

            <p className="text-slate-400 max-w-sm leading-relaxed text-xs sm:text-sm">
              Next-generation open-source WebGL dental STL previewer & 32-stage orthodontic aligner simulator. Built for orthodontists, clinics, dental labs, and CAD developers.
            </p>

            {/* Live Operational Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational • WebGL 2.0 Ready</span>
            </div>

            {/* Social & Community Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/Sonu-Thomas-001/AlignView-3D"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all text-xs font-semibold"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repo</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Col 3: Product Capabilities */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>Studio & Tools</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/studio" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors">
                  <span>3D Dental Studio</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">LIVE</span>
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>32-Stage Aligner</span>
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sub-mm Caliper</span>
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>4 Diagnostic Shaders</span>
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cross-Section Slicing</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Navigation */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Key Features</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">Clinical Workflow</a></li>
              <li><a href="#comparison" className="hover:text-white transition-colors">CAD Comparison</a></li>
              <li><a href="#metrics" className="hover:text-white transition-colors">Performance Specs</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Col 5: Technology & Specs */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Technology
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Next.js 16 (Turbopack)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Three.js & R3F</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Zustand State Store</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Tailwind CSS System</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Client-Side Privacy</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Back to Top Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© {new Date().getFullYear()} AlignView 3D.</span>
            <span className="hidden sm:inline">•</span>
            <span>Crafted by Sonu Thomas.</span>
            <span className="hidden sm:inline">•</span>
            <span>MIT Open-Source License.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all shadow-sm"
              title="Scroll to Top"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
