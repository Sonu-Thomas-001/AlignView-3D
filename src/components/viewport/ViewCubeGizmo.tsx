'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';

export const ViewCubeGizmo: React.FC = () => {
  const { snapCameraTo, cameraTargetView } = useViewerStore();

  const isFront = !cameraTargetView || cameraTargetView === 'front' || cameraTargetView === 'reset';

  return (
    <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 z-20 select-none">
      <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/90 backdrop-blur-md shadow-gizmo border border-slate-200/80 p-0.5 sm:p-1 flex items-center justify-center transition-all hover:shadow-lg">
        {/* Up Button */}
        <button
          id="btn-gizmo-up"
          onClick={() => snapCameraTo('top')}
          title="Top View (U)"
          className={`absolute top-0.5 sm:top-1.5 left-1/2 -translate-x-1/2 w-4 sm:w-6 h-3.5 sm:h-5 flex items-center justify-center rounded text-[10px] sm:text-xs font-semibold transition-colors ${
            cameraTargetView === 'top'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          U
        </button>

        {/* Down Button */}
        <button
          id="btn-gizmo-down"
          onClick={() => snapCameraTo('bottom')}
          title="Bottom View (D)"
          className={`absolute bottom-0.5 sm:bottom-1.5 left-1/2 -translate-x-1/2 w-4 sm:w-6 h-3.5 sm:h-5 flex items-center justify-center rounded text-[10px] sm:text-xs font-semibold transition-colors ${
            cameraTargetView === 'bottom'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          D
        </button>

        {/* Left Button */}
        <button
          id="btn-gizmo-left"
          onClick={() => snapCameraTo('left')}
          title="Left View (L)"
          className={`absolute left-0.5 sm:left-1.5 top-1/2 -translate-y-1/2 w-3.5 sm:w-5 h-4 sm:h-6 flex items-center justify-center rounded text-[10px] sm:text-xs font-semibold transition-colors ${
            cameraTargetView === 'left'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          L
        </button>

        {/* Right Button */}
        <button
          id="btn-gizmo-right"
          onClick={() => snapCameraTo('right')}
          title="Right View (R)"
          className={`absolute right-0.5 sm:right-1.5 top-1/2 -translate-y-1/2 w-3.5 sm:w-5 h-4 sm:h-6 flex items-center justify-center rounded text-[10px] sm:text-xs font-semibold transition-colors ${
            cameraTargetView === 'right'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          R
        </button>

        {/* Center / Front Button */}
        <button
          id="btn-gizmo-front"
          onClick={() => snapCameraTo('front')}
          title="Front View (F)"
          className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm transition-all ${
            isFront
              ? 'bg-blue-600 text-white ring-1 sm:ring-2 ring-blue-300'
              : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          F
        </button>
      </div>
    </div>
  );
};
