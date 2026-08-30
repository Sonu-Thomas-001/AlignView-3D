'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { Palette, Check, Sun, Moon } from 'lucide-react';

export interface DentalShade {
  name: string;
  hex: string;
  description: string;
}

export const DENTAL_SHADES: DentalShade[] = [
  { name: 'Pure White', hex: '#FFFFFF', description: 'Clinical Porcelain' },
  { name: 'Natural Enamel', hex: '#FAF7EE', description: 'Translucent Natural' },
  { name: 'Gypsum Stone', hex: '#ECE5D8', description: 'Classic Dental Stone' },
  { name: 'Ceramic Ivory', hex: '#F3EDE2', description: 'Warm Aesthetic' },
  { name: 'Stone Blue', hex: '#DCE7F2', description: 'High-Contrast Die' },
  { name: 'Medical Mint', hex: '#DCF4ED', description: 'Clinical Pastel' },
  { name: 'Pearl Gold', hex: '#EFE6D5', description: 'Champagne Luster' },
  { name: 'Slate Graphite', hex: '#475569', description: 'Light Mode Contrast' },
];

export const ModelColorPicker: React.FC = () => {
  const { modelColor, setModelColor, studioTheme, toggleStudioTheme } = useViewerStore();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isDark = studioTheme === 'dark';

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        id="model-color-picker-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : isDark
            ? 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
        title="Change Model Color & Theme"
      >
        <span 
          className="w-3.5 h-3.5 rounded-full border border-slate-400/50 shadow-2xs shrink-0" 
          style={{ backgroundColor: modelColor }} 
        />
        <Palette className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Color</span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className={`absolute bottom-full right-0 mb-2 w-64 rounded-2xl shadow-xl border p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/80 text-white'
            : 'bg-white/95 border-slate-200 text-slate-800'
        }`}>
          {/* Header with Theme Switcher */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/50 dark:border-slate-800">
            <span className="text-xs font-bold tracking-tight">Model Shade & Theme</span>
            
            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleStudioTheme}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                isDark 
                  ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
              title={isDark ? 'Switch to Light Studio' : 'Switch to Dark Studio'}
            >
              {isDark ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
              <span>{isDark ? 'Dark' : 'Light'}</span>
            </button>
          </div>

          {/* Preset Swatches */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {DENTAL_SHADES.map((shade) => {
              const isSelected = modelColor.toLowerCase() === shade.hex.toLowerCase();
              return (
                <button
                  key={shade.hex}
                  onClick={() => setModelColor(shade.hex)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl text-left transition-all border text-xs ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                      : isDark
                      ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-slate-400/40 shadow-xs shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: shade.hex }}
                  >
                    {isSelected && (
                      <Check className={`w-2.5 h-2.5 ${shade.hex === '#FFFFFF' || shade.hex === '#FAF7EE' ? 'text-slate-900' : 'text-white'}`} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[11px] truncate leading-tight">{shade.name}</p>
                    <p className="text-[9px] text-slate-400 truncate leading-none mt-0.5">{shade.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Color Input */}
          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
          }`}>
            <span className="text-[11px] font-medium text-slate-400">Custom Hex:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={modelColor}
                onChange={(e) => setModelColor(e.target.value)}
                className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                title="Pick Custom Color"
              />
              <span className="text-xs font-mono font-bold uppercase">{modelColor}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
