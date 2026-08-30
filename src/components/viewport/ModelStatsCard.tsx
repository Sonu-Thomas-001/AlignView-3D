'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';

export const ModelStatsCard: React.FC = () => {
  const { modelStats, studioTheme } = useViewerStore();
  const isDark = studioTheme === 'dark';

  return (
    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 select-none">
      <div className={`backdrop-blur-md rounded-xl sm:rounded-2xl shadow-floating border py-1.5 sm:py-2.5 px-2.5 sm:px-4 text-[10px] sm:text-[11px] flex flex-col gap-0.5 sm:gap-1 min-w-[120px] sm:min-w-[150px] transition-colors ${
        isDark
          ? 'bg-slate-900/85 border-slate-700/80 text-slate-300'
          : 'bg-white/85 border-slate-200/70 text-slate-600'
      }`}>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <span className={isDark ? 'text-slate-400 font-medium' : 'text-slate-400 font-medium'}>Vertices</span>
          <span className={`font-semibold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`} suppressHydrationWarning>
            {modelStats.vertices.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <span className={isDark ? 'text-slate-400 font-medium' : 'text-slate-400 font-medium'}>Triangles</span>
          <span className={`font-semibold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`} suppressHydrationWarning>
            {modelStats.triangles.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <span className={isDark ? 'text-slate-400 font-medium' : 'text-slate-400 font-medium'}>Size</span>
          <span className={`font-semibold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`} suppressHydrationWarning>
            {modelStats.width} × {modelStats.depth} × {modelStats.height} mm
          </span>
        </div>
      </div>
    </div>
  );
};
