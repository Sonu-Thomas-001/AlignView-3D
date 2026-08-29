'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Heart, Shield, ArrowUp } from 'lucide-react';

const AppLogoTooth = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#2563EB" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="w-6 h-6"
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
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-blue-900/50 border border-blue-500/30 flex items-center justify-center">
                <AppLogoTooth />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                AlignView <span className="text-blue-400 font-extrabold">3D</span>
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm leading-relaxed text-xs sm:text-sm">
              Open-source, web-based 3D dental STL previewer & clear aligner treatment simulation platform engineered for orthodontists, dentists, and CAD laboratories.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/Sonu-Thomas-001/AlignView-3D"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li><Link href="/studio" className="hover:text-white transition-colors">3D Dental Studio</Link></li>
              <li><a href="#features" className="hover:text-white transition-colors">Key Features</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">Clinical Workflow</a></li>
              <li><a href="#comparison" className="hover:text-white transition-colors">CAD Comparison</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Col 3: Technology & Specs */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Technology</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>Next.js 16 (Turbopack)</li>
              <li>Three.js & React Three Fiber</li>
              <li>Zustand State Management</li>
              <li>Tailwind CSS Design System</li>
              <li>Client-Side WebGL 2.0 Engine</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            © {new Date().getFullYear()} AlignView 3D. MIT Licensed.
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
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
