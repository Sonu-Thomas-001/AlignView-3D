'use client';

import React, { useEffect, useState } from 'react';

export const AppPreloader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing WebGL 2.0 Engine...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Loading Biomechanical Shaders...');
    }, 250);

    const timer2 = setTimeout(() => {
      setProgress(82);
      setStatusText('Configuring 3D Studio Environment...');
    }, 600);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('AlignView 3D Ready');
    }, 950);

    const timer4 = setTimeout(() => {
      setFadeOut(true);
    }, 1250);

    const timer5 = setTimeout(() => {
      setLoading(false);
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 transition-all duration-700 ease-out select-none px-4 ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ isolation: 'isolate' }}
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] sm:h-[550px] bg-gradient-to-tr from-blue-600/25 via-sky-500/20 to-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/4 left-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

      {/* Center High-Impact Stage */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg sm:max-w-xl w-full">
        
        {/* Large Animated Brand Logo Stage */}
        <div className="relative mb-10 sm:mb-12 flex items-center justify-center">
          
          {/* Pulsing Radial Aura Backlight */}
          <div className="absolute -inset-10 sm:-inset-16 rounded-full bg-gradient-to-tr from-blue-500/30 via-sky-400/30 to-indigo-500/30 blur-2xl animate-pulse" />
          
          {/* Subtle Outer Orbital Rings */}
          <div className="absolute -inset-8 sm:-inset-12 rounded-full border border-blue-500/20 border-t-sky-400/80 animate-spin pointer-events-none" style={{ animationDuration: '4s' }} />
          <div className="absolute -inset-4 sm:-inset-6 rounded-full border border-indigo-500/20 border-b-blue-400/80 animate-spin pointer-events-none" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />

          {/* Large Logo Showcase Glass Panel */}
          <div className="relative px-8 sm:px-12 py-6 sm:py-8 rounded-3xl sm:rounded-4xl bg-slate-900/80 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex items-center justify-center group">
            <img
              src="/main-logo-light.png"
              alt="AlignView 3D"
              className="h-16 sm:h-24 md:h-28 w-auto max-w-[280px] sm:max-w-[420px] object-contain drop-shadow-2xl animate-pulse-glow"
            />
          </div>
        </div>

        {/* Progress Telemetry & Status Bar */}
        <div className="w-full max-w-md sm:max-w-lg space-y-4 px-2">
          
          {/* Status Label & Percentage Readout */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
            <span className="text-slate-300 font-semibold tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              <span>{statusText}</span>
            </span>
            <span className="text-blue-400 font-extrabold text-sm sm:text-base font-mono">{progress}%</span>
          </div>

          {/* Precision Neon Progress Track */}
          <div className="h-2 sm:h-2.5 w-full bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 rounded-full transition-all duration-300 ease-out shadow-md shadow-blue-500/50 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmering Glint */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Tagline Badge */}
          <div className="pt-1 flex items-center justify-center gap-2 text-slate-500 text-[11px] sm:text-xs uppercase font-bold tracking-widest font-mono">
            <span>Orthodontic STL Viewer</span>
            <span>•</span>
            <span>WebGL 2.0</span>
          </div>

        </div>

      </div>
    </div>
  );
};
