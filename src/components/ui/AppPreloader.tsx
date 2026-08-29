'use client';

import React, { useEffect, useState } from 'react';

export const AppPreloader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState('Initializing WebGL Engine...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if preloader was already shown in this session (optional, but keep fast & premium)
    const timer1 = setTimeout(() => {
      setProgress(48);
      setStatusText('Loading Biomechanical Shaders...');
    }, 300);

    const timer2 = setTimeout(() => {
      setProgress(86);
      setStatusText('Configuring 3D Studio Environment...');
    }, 700);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('AlignView 3D Ready');
    }, 1100);

    const timer4 = setTimeout(() => {
      setFadeOut(true);
    }, 1350);

    const timer5 = setTimeout(() => {
      setLoading(false);
    }, 1900);

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-all duration-700 ease-out select-none ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Ambient Glow Flares */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[350px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Center Logo & Loading Box */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full">
        
        {/* Animated Glowing Logo Container */}
        <div className="relative mb-8 group">
          {/* Pulsing Backlight Ring */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-400 opacity-40 blur-xl animate-pulse" />
          
          {/* Center Logo Card */}
          <div className="relative p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex items-center justify-center">
            <img
              src="/main-logo-light.png"
              alt="AlignView 3D"
              className="h-12 sm:h-14 w-auto object-contain animate-bounce-subtle drop-shadow-md"
            />
          </div>

          {/* Orbiting Orbital Aligner Spinner Particle */}
          <div className="absolute -inset-2 rounded-full border border-blue-500/30 border-t-blue-400 animate-spin pointer-events-none" />
        </div>

        {/* Status Text & Progress Counter */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-semibold tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              {statusText}
            </span>
            <span className="text-blue-400 font-bold">{progress}%</span>
          </div>

          {/* Futuristic High-Precision Progress Bar */}
          <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden p-0.5 border border-slate-800/80 bg-slate-900">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 rounded-full transition-all duration-300 ease-out shadow-xs shadow-blue-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Subtitle Badge */}
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 pt-1">
            Precision Orthodontic Engine
          </p>
        </div>

      </div>
    </div>
  );
};
