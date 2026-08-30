'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { Scissors, X } from 'lucide-react';

export const SectionSlider: React.FC = () => {
  const { 
    activeTool, 
    sectionPlaneOffset, 
    setSectionPlaneOffset,
    sectionAxis, 
    setSectionAxis,
    setActiveTool,
    studioTheme,
  } = useViewerStore();

  if (activeTool !== 'section') return null;

  const isDark = studioTheme === 'dark';

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className={`backdrop-blur-md rounded-2xl shadow-floating border py-2.5 px-4 flex items-center gap-3 transition-colors ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/90 text-white'
          : 'bg-white/95 border-slate-200/90 text-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Scissors className="w-3.5 h-3.5 text-blue-500" />
          <span>Cross Section</span>
        </div>

        {/* Axis Selector */}
        <div className={`flex items-center p-0.5 rounded-lg text-[11px] font-medium ${
          isDark ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <button
              key={axis}
              onClick={() => setSectionAxis(axis)}
              className={`px-2 py-0.5 rounded uppercase transition-colors ${
                sectionAxis === axis
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {axis}
            </button>
          ))}
        </div>

        {/* Plane Offset Range Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="-30"
            max="30"
            step="0.5"
            value={sectionPlaneOffset}
            onChange={(e) => setSectionPlaneOffset(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className={`text-xs font-mono font-medium w-12 text-right ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {sectionPlaneOffset > 0 ? `+${sectionPlaneOffset}` : sectionPlaneOffset} mm
          </span>
        </div>

        {/* Close Section Tool Button */}
        <button
          onClick={() => setActiveTool('move')}
          className={`p-1 rounded-lg transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
          }`}
          title="Exit Sectioning Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
