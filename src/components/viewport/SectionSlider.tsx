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
  } = useViewerStore();

  if (activeTool !== 'section') return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-floating border border-slate-200/90 py-2.5 px-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Scissors className="w-3.5 h-3.5 text-blue-600" />
          <span>Cross Section</span>
        </div>

        {/* Axis Selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <button
              key={axis}
              onClick={() => setSectionAxis(axis)}
              className={`px-2 py-0.5 rounded uppercase transition-colors ${
                sectionAxis === axis
                  ? 'bg-blue-600 text-white shadow-sm'
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
          <span className="text-xs font-mono font-medium text-slate-700 w-12 text-right">
            {sectionPlaneOffset > 0 ? `+${sectionPlaneOffset}` : sectionPlaneOffset} mm
          </span>
        </div>

        {/* Close Section Tool Button */}
        <button
          onClick={() => setActiveTool('move')}
          className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
          title="Close section tool"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
