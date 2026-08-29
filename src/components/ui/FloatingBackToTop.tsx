'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';

const FloatingToothIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="w-5 h-5"
  >
    <path d="M12 3C8.5 3 6 5 6 8.5c0 4 2 6 2.5 10 .5 4 3 4.5 3.5 4.5s3-.5 3.5-4.5c.5-4 2.5-6 2.5-10C18 5 15.5 3 12 3z" />
    <path d="M12 3v5" />
  </svg>
);

export const FloatingBackToTop: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={scrollToTop}
        className="group relative p-3 sm:p-3.5 rounded-full bg-slate-900/90 hover:bg-blue-600 active:bg-blue-700 text-white backdrop-blur-md border border-slate-700/80 hover:border-blue-400 shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center cursor-pointer"
        aria-label="Scroll to top"
        title="Back to top"
      >
        {/* Ambient Ring Glow */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md group-hover:bg-blue-500/40 transition-colors pointer-events-none" />

        {/* Tooth Icon + Mini Arrow Up badge */}
        <div className="relative flex items-center justify-center text-blue-400 group-hover:text-white transition-colors">
          <FloatingToothIcon />
          <div className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>

        {/* Tooltip on hover */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold shadow-lg border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:inline-block">
          Back to top ↑
        </span>
      </button>
    </div>
  );
};
