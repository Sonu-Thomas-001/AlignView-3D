'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { RenderMode } from '@/types/dental';
import { Box, Eye } from 'lucide-react';
import { ModelColorPicker } from './ModelColorPicker';

const ShadedIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="9" opacity="0.85" />
    <path d="M12 3a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9V3z" fill="#ffffff" opacity="0.4" />
  </svg>
);

const WireframeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M12 3a14.5 14.5 0 0 0 0 18M12 3a14.5 14.5 0 0 1 0 18" />
  </svg>
);

interface RenderOption {
  id: RenderMode;
  label: string;
  icon: React.ReactNode;
}

const RENDER_OPTIONS: RenderOption[] = [
  { id: 'shaded', label: 'Shaded', icon: <ShadedIcon className="w-3.5 h-3.5" /> },
  { id: 'wireframe', label: 'Wireframe', icon: <WireframeIcon className="w-3.5 h-3.5" /> },
  { id: 'solid', label: 'Solid', icon: <Box className="w-3.5 h-3.5" /> },
  { id: 'xray', label: 'X-Ray', icon: <Eye className="w-3.5 h-3.5" /> },
];

export const RenderModePill: React.FC = () => {
  const { renderMode, setRenderMode, studioTheme } = useViewerStore();
  const isDark = studioTheme === 'dark';

  return (
    <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 select-none flex items-center gap-1.5 sm:gap-2">
      {/* Model Shade & Color Picker */}
      <ModelColorPicker />

      {/* Render Mode Group */}
      <div className={`backdrop-blur-md rounded-2xl shadow-floating border p-0.5 sm:p-1 flex items-center gap-0.5 sm:gap-1 transition-colors ${
        isDark
          ? 'bg-slate-900/90 border-slate-700/80 text-white'
          : 'bg-white/95 border-slate-200/80 text-slate-800'
      }`}>
        {RENDER_OPTIONS.map((opt) => {
          const isActive = renderMode === opt.id;
          return (
            <button
              key={opt.id}
              id={`render-mode-btn-${opt.id}`}
              onClick={() => setRenderMode(opt.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={opt.label}
            >
              {opt.icon}
              <span className="hidden md:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
