'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { Sparkles, Activity } from 'lucide-react';

export const ToothHoverTooltip: React.FC = () => {
  const { hoveredTooth, currentStep } = useViewerStore();

  if (!hoveredTooth) return null;

  const isUpper = hoveredTooth.arch === 'upper';

  return (
    <div
      className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full transition-all duration-75"
      style={{
        left: hoveredTooth.screenX,
        top: hoveredTooth.screenY - 14,
      }}
    >
      <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-xl px-3 py-2 shadow-2xl border border-slate-750 flex flex-col gap-1 min-w-[190px] animate-in fade-in zoom-in-95 duration-100">
        {/* Header: FDI Badge & Anatomical Name */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-black tracking-wider ${
              isUpper ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              #{hoveredTooth.fdi}
            </span>
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">
              {hoveredTooth.shortName}
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
            {hoveredTooth.quadrant}
          </span>
        </div>

        {/* Full Anatomical Description */}
        <p className="text-xs font-semibold text-slate-100 leading-tight">
          {hoveredTooth.name}
        </p>

        {/* Clinical Movement Telemetry */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-300">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-400" />
            <span>Stage {currentStep} Velocity</span>
          </div>
          <span className="font-bold text-emerald-400 tabular-nums">
            0.18 mm / 1.3°
          </span>
        </div>
      </div>

      {/* Downward pointer triangle */}
      <div className="w-2.5 h-2.5 bg-slate-900/90 rotate-45 mx-auto -mt-1 border-r border-b border-slate-750 shadow-sm" />
    </div>
  );
};
