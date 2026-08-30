'use client';

import React from 'react';
import { 
  Move, 
  RotateCw, 
  Search, 
  Hand, 
  Ruler, 
  Layers 
} from 'lucide-react';
import { useViewerStore } from '@/store/useViewerStore';
import { ActiveTool } from '@/types/dental';

interface ToolItem {
  id: ActiveTool;
  label: string;
  icon: React.ReactNode;
}

const TOOLS: ToolItem[] = [
  { id: 'move', label: 'Move', icon: <Move className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> },
  { id: 'rotate', label: 'Rotate', icon: <RotateCw className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> },
  { id: 'zoom', label: 'Zoom', icon: <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> },
  { id: 'pan', label: 'Pan', icon: <Hand className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> },
  { id: 'measure', label: 'Measure', icon: <Ruler className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> },
  { id: 'section', label: 'Section', icon: <Layers className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> },
];

export const FloatingToolPalette: React.FC = () => {
  const { activeTool, setActiveTool, studioTheme } = useViewerStore();
  const isDark = studioTheme === 'dark';

  return (
    <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 select-none">
      <div className={`backdrop-blur-md rounded-xl sm:rounded-2xl shadow-floating border p-1 flex flex-col gap-0.5 sm:gap-1 w-12 sm:w-16 items-center transition-colors ${
        isDark
          ? 'bg-slate-900/90 border-slate-700/80 text-white'
          : 'bg-white/95 border-slate-200/80 text-slate-800'
      }`}>
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              id={`tool-btn-${tool.id}`}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-medium'
                  : isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white font-normal'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-normal'
              }`}
              title={tool.label}
            >
              <div className="mb-0.5 sm:mb-1">{tool.icon}</div>
              <span className="text-[9px] sm:text-[10px] tracking-tight hidden sm:block">{tool.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
