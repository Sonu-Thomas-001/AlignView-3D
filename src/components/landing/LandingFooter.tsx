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
  FileText,
  Lock,
  Shield
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

const AppLogoTooth = () => (
  <img 
    src="/favicon.png" 
    alt="AlignView 3D" 
    className="w-7 h-7 object-contain" 
  />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 relative z-10">
        
        {/* Pre-Footer Action Ribbon */}
        <ScrollReveal animation="scale-up">
          <div className="mb-10 p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 backdrop-blur-md">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Ready to inspect your dental STL models?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Launch the studio now — zero installation, zero lag, 100% client-side privacy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/studio"
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                Open 3D Studio →
              </Link>
              <a
                href="https://github.com/Sonu-Thomas-001/AlignView-3D"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/80"
                title="Official GitHub Repository"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* 4-Column Structured Navigation */}
        <ScrollReveal animation="fade-up" delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 mb-10">
            
            {/* Col 1 & 2: Brand Identity & Mission */}
            <div className="lg:col-span-2 space-y-3.5">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <div className="p-1.5 rounded-xl bg-blue-950/80 border border-blue-500/30 group-hover:border-blue-400 transition-colors shadow-inner flex items-center justify-center">
                  <AppLogoTooth />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                    AlignView <span className="text-blue-500">3D</span>
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Dental Visualization Engine
                  </span>
                </div>
              </Link>

              <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
                Proprietary WebGL dental STL previewer & 32-stage orthodontic aligner simulator. Engineered for orthodontists, clinics, dental labs, and CAD developers.
              </p>

              {/* Live Operational Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational • WebGL 2.0 Ready</span>
              </div>

              {/* Official Repo Link */}
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://github.com/Sonu-Thomas-001/AlignView-3D"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all text-xs font-semibold"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Official Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            </div>

            {/* Col 3: Product Capabilities */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                <span>Studio & Tools</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/studio" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors">
                    <span>3D Dental Studio</span>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">LIVE</span>
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
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-white transition-colors">Key Features</a></li>
                <li><a href="#metrics" className="hover:text-white transition-colors">Performance Specs</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
              </ul>
            </div>

            {/* Col 5: Legal & Security Policies */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
                Legal & Trust
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Terms & License</span>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Privacy & HIPAA</span>
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>Security Sandbox</span>
                  </Link>
                </li>
                <li className="pt-1 flex items-center gap-1.5 text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Client-Side Privacy</span>
                </li>
              </ul>
            </div>

          </div>
        </ScrollReveal>

        {/* Bottom Copyright & Back to Top Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span>© {new Date().getFullYear()} AlignView 3D by Sonu Thomas.</span>
            <span className="hidden sm:inline">•</span>
            <span>Proprietary Software. All Rights Reserved.</span>
            <span className="hidden sm:inline">•</span>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all shadow-sm text-xs"
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
