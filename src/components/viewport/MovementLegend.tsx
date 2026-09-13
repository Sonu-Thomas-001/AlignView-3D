'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { MOVEMENT_LEGEND } from '@/utils/movementAnalytics';

/**
 * Colour key for the movement heat map.
 *
 * The scale is not fixed. It is set per stage from the 95th percentile of the measured
 * movement, so the same red means a different number of millimetres on a stage that moves
 * a lot than on one that barely moves. That makes labelling the ends of the ramp with the
 * actual figure the whole point of this panel: without it, red only means "more than the
 * rest of this arch", which is easy to misread as "a lot".
 */
export const MovementLegend: React.FC = () => {
  const { renderMode, movementScaleMm, movementFromStage, studioTheme } = useViewerStore();

  if (renderMode !== 'movement') return null;

  const isDark = studioTheme === 'dark';
  const measured = movementScaleMm !== null && movementScaleMm > 0;

  return (
    <div
      className={`absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 select-none backdrop-blur-md rounded-2xl shadow-floating border px-3 py-2 transition-colors ${
        isDark
          ? 'bg-slate-900/90 border-slate-700/80 text-white'
          : 'bg-white/95 border-slate-200/80 text-slate-800'
      }`}
    >
      {measured ? (
        <>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-[11px] font-bold tracking-tight">Crown movement</span>
            <span className="text-[10px] text-slate-400">
              {movementFromStage !== null ? `vs stage ${movementFromStage}` : 'vs start'}
            </span>
          </div>

          {/* Ramp, drawn from the same stops the mesh colours use. The first legend
              entry is the flat grey given to surfaces that did not move at all, which is
              a sentinel rather than the bottom of the ramp, so it gets its own swatch. */}
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-4 rounded-full border border-slate-400/30 shrink-0"
              style={{ backgroundColor: MOVEMENT_LEGEND[0].color }}
              title={MOVEMENT_LEGEND[0].label}
            />
            <div
              className="h-2 flex-1 w-32 sm:w-48 rounded-full border border-slate-400/30"
              style={{
                backgroundImage: `linear-gradient(to right, ${
                  MOVEMENT_LEGEND.slice(1).map(s => s.color).join(', ')
                })`,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
            <span>Unchanged</span>
            <span className="font-mono">{movementScaleMm.toFixed(2)} mm or more</span>
          </div>
        </>
      ) : (
        <div className="text-[11px] font-medium text-slate-400 max-w-56">
          Nothing to measure against yet. Load an earlier stage of the same arch, or pick a
          stage after the first.
        </div>
      )}
    </div>
  );
};
