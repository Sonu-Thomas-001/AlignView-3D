'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
    <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 transition-all duration-300 pointer-events-none">
      <header
        className={`max-w-7xl mx-auto rounded-full transition-all duration-300 pointer-events-auto flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-xl shadow-lg border border-slate-200/80'
            : 'bg-white/70 backdrop-blur-md shadow-sm border border-slate-200/50'
        }`}
      >
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <img 
            src="/main-logo.png" 
            alt="AlignView 3D Logo" 
            className="h-10 sm:h-12 w-auto max-w-[200px] object-contain group-hover:scale-105 transition-transform" 
          />
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/60 shadow-inner">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all"
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
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
          >
            Sign In
          </Link>

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
