'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';

export const ModelStatsCard: React.FC = () => {
  const { modelStats } = useViewerStore();

  return (
    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 select-none">
      <div className="bg-white/85 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-floating border border-slate-200/70 py-1.5 sm:py-2.5 px-2.5 sm:px-4 text-[10px] sm:text-[11px] text-slate-600 flex flex-col gap-0.5 sm:gap-1 min-w-[120px] sm:min-w-[150px]">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <span className="text-slate-400 font-medium">Vertices</span>
          <span className="font-semibold text-slate-800 tabular-nums" suppressHydrationWarning>
            {modelStats.vertices.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <span className="text-slate-400 font-medium">Triangles</span>
          <span className="font-semibold text-slate-800 tabular-nums" suppressHydrationWarning>
            {modelStats.triangles.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <span className="text-slate-400 font-medium">Size</span>
          <span className="font-semibold text-slate-800 tabular-nums" suppressHydrationWarning>
            {modelStats.width} × {modelStats.depth} × {modelStats.height} mm
          </span>
        </div>
      </div>
    </div>
  );
};
