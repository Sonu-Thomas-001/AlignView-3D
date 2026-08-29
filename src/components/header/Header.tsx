'use client';

import React, { useState } from 'react';
import { 
  RotateCcw, 
  Camera, 
  Maximize, 
  Minimize, 
  Download, 
  Upload,
  Layers,
  FolderOpen
} from 'lucide-react';
import { useViewerStore } from '@/store/useViewerStore';

const AppLogoTooth = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#2563EB" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="w-7 h-7 sm:w-8 sm:h-8"
  >
    <path d="M12 3C8.5 3 6 5 6 8.5c0 4 2 6 2.5 10 .5 4 3 4.5 3.5 4.5s3-.5 3.5-4.5c.5-4 2.5-6 2.5-10C18 5 15.5 3 12 3z" />
    <path d="M12 3v5" />
  </svg>
);

export const Header: React.FC = () => {
  const { 
    triggerResetView, 
    triggerScreenshot, 
    openUploadModal,
    activeMobileDrawer,
    toggleMobileDrawer,
    upperFiles,
    lowerFiles,
  } = useViewerStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleExport = () => {
    triggerScreenshot();
  };

  return (
    <header className="h-16 px-3 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between select-none z-30 shrink-0 gap-2">
      {/* Left: Brand Identity + Mobile Arch Toggles */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        <a 
          href="/" 
          className="flex items-center gap-2 sm:gap-3 group"
          title="Return to Home Landing Page"
        >
          <div className="p-1 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-center justify-center shrink-0">
            <AppLogoTooth />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight tracking-tight flex items-center gap-2">
              AlignView 3D
            </h1>
            <p className="text-[10px] sm:text-xs font-medium text-slate-400 hidden xs:block">
              View <span className="text-slate-300">•</span> Compare <span className="text-slate-300">•</span> Analyze
            </p>
          </div>
        </a>

        {/* Mobile/Tablet Arch Sidebar Trigger Pills (visible below lg screen) */}
        <div className="flex lg:hidden items-center gap-1.5 ml-1 sm:ml-2">
          <button
            onClick={() => toggleMobileDrawer('upper')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMobileDrawer === 'upper'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span>Upper</span>
            <span className="text-[10px] opacity-80">({upperFiles.length})</span>
          </button>

          <button
            onClick={() => toggleMobileDrawer('lower')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMobileDrawer === 'lower'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span>Lower</span>
            <span className="text-[10px] opacity-80">({lowerFiles.length})</span>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Upload Custom STL */}
        <button
          id="btn-header-upload"
          onClick={() => openUploadModal('upper')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
          title="Upload custom STL file"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Upload STL</span>
        </button>

        {/* Reset View */}
        <button
          id="btn-header-reset-view"
          onClick={triggerResetView}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Reset View</span>
        </button>

        {/* Screenshot */}
        <button
          id="btn-header-screenshot"
          onClick={triggerScreenshot}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
          title="Capture High-Res Screenshot"
        >
          <Camera className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Screenshot</span>
        </button>

        {/* Full Screen */}
        <button
          id="btn-header-fullscreen"
          onClick={toggleFullscreen}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <>
              <Minimize className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Full Screen</span>
            </>
          )}
        </button>

        {/* Export View */}
        <button
          id="btn-header-export"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-sm shadow-blue-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Export View</span>
        </button>
      </div>
    </header>
  );
};
