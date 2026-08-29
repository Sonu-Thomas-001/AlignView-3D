'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { ViewMode } from '@/types/dental';
import { Columns2 } from 'lucide-react';

const ToothIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4C9 4 7 5.5 7 8c0 3.5 1.5 5 2 8 .5 3 2 4 3 4s2.5-1 3-4c.5-3 2-4.5 2-8 0-2.5-2-4-5-4z" />
    <path d="M12 4v4" />
  </svg>
);

const UpperToothIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 9c0-3.5 3.1-6 7-6s7 2.5 7 6c0 2-.5 4-2 6-1.2 1.6-2.5 2-5 2s-3.8-.4-5-2c-1.5-2-2-4-2-6z" />
  </svg>
);

const LowerToothIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 15c0 3.5 3.1 6 7 6s7-2.5 7-6c0-2-.5-4-2-6-1.2-1.6-2.5-2-5-2s-3.8.4-5 2c-1.5 2-2 4-2 6z" />
  </svg>
);

interface ModeOption {
  id: ViewMode;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const MODES: ModeOption[] = [
  { id: 'both', label: 'Both Arches', shortLabel: 'Both', icon: <ToothIcon className="w-3.5 h-3.5" /> },
  { id: 'upper', label: 'Upper Only', shortLabel: 'Upper', icon: <UpperToothIcon className="w-3.5 h-3.5" /> },
  { id: 'lower', label: 'Lower Only', shortLabel: 'Lower', icon: <LowerToothIcon className="w-3.5 h-3.5" /> },
  { id: 'split', label: 'Split View', shortLabel: 'Split', icon: <Columns2 className="w-3.5 h-3.5" /> },
];

export const ViewModePill: React.FC = () => {
  const { viewMode, setViewMode } = useViewerStore();

  return (
    <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-20 select-none max-w-[90vw] overflow-x-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-full shadow-floating border border-slate-200/80 p-0.5 sm:p-1 flex items-center gap-0.5 sm:gap-1">
        {MODES.map((mode) => {
          const isActive = viewMode === mode.id;
          return (
            <button
              key={mode.id}
              id={`view-mode-btn-${mode.id}`}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {mode.icon}
              <span className="hidden sm:inline">{mode.label}</span>
              <span className="sm:hidden">{mode.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
