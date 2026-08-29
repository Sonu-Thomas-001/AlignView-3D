'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { Ruler, Trash2, X } from 'lucide-react';

export const MeasurementOverlay: React.FC = () => {
  const { 
    activeTool, 
    measurements, 
    pendingMeasurementPoint, 
    clearMeasurements, 
    setActiveTool 
  } = useViewerStore();

  if (activeTool !== 'measure' && measurements.length === 0) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-floating border border-slate-200/90 py-2 px-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Ruler className="w-3.5 h-3.5 text-blue-600" />
          <span>Point-to-Point Caliper</span>
        </div>

        {pendingMeasurementPoint && (
          <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
            Click 2nd point on tooth to measure
          </span>
        )}

        {measurements.length > 0 && (
          <div className="flex items-center gap-2">
            {measurements.map((m, idx) => (
              <span key={idx} className="text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                #{idx + 1}: {m.distanceMm} mm
              </span>
            ))}
            <button
              onClick={clearMeasurements}
              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear measurements"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {activeTool === 'measure' && (
          <button
            onClick={() => setActiveTool('move')}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            title="Done measuring"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
