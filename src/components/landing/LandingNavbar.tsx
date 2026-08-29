'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Menu, 
  X, 
  Github, 
  Layers, 
  Activity, 
  Sliders, 
  HelpCircle,
  Flame
} from 'lucide-react';

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

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Metrics', href: '#metrics' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-2 sm:py-3 pointer-events-none transition-all duration-300">
      <header 
        className={`max-w-6xl mx-auto rounded-2xl sm:rounded-full pointer-events-auto transition-all duration-300 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-900/5' 
            : 'bg-white/80 backdrop-blur-md border-slate-200/80 shadow-floating'
        }`}
      >
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="p-1.5 rounded-xl bg-blue-50 group-hover:bg-blue-100 group-hover:scale-105 transition-all shadow-inner flex items-center justify-center">
            <AppLogoTooth />
          </div>
          <div>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
              AlignView <span className="text-blue-600 font-extrabold">3D</span>
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Orthodontic Engine
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60 shadow-inner">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {/* Sign In Link */}
          <Link
            href="/login"
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
          >
            Sign In
          </Link>

          {/* GitHub Star Button */}
          <a
            href="https://github.com/Sonu-Thomas-001/AlignView-3D"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all shadow-xs"
            title="Star AlignView 3D on GitHub"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Star</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-500 border border-slate-200 shadow-2xs">
              v1.0
            </span>
          </a>

          {/* Launch Studio CTA */}
          <Link
            href="/studio"
            className="group relative inline-flex items-center gap-2 px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 overflow-hidden transform hover:-translate-y-0.5"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Launch 3D Studio
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Sign In
          </Link>

          <Link
            href="/studio"
            className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm"
          >
            Studio →
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xl pointer-events-auto animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-800 bg-slate-100 rounded-xl"
            >
              <span>Clinician Sign In</span>
            </Link>

            <a
              href="https://github.com/Sonu-Thomas-001/AlignView-3D"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
            >
              <Github className="w-4 h-4" />
              <span>Official GitHub Repository</span>
            </a>

            <Link
              href="/studio"
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl shadow-md"
            >
              <span>Launch Full 3D Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
