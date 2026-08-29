'use client';

import React, { useState } from 'react';
import { 
  RotateCcw, 
  Camera, 
  Maximize, 
  Minimize, 
  Download, 
  Upload
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
    className="w-8 h-8"
  >
    <path d="M12 3C8.5 3 6 5 6 8.5c0 4 2 6 2.5 10 .5 4 3 4.5 3.5 4.5s3-.5 3.5-4.5c.5-4 2.5-6 2.5-10C18 5 15.5 3 12 3z" />
    <path d="M12 3v5" />
  </svg>
);

export const Header: React.FC = () => {
  const { triggerResetView, triggerScreenshot, openUploadModal } = useViewerStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleExport = () => {
    // Trigger screenshot download + metadata json bundle
    triggerScreenshot();
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3.5">
        <div className="p-1 rounded-xl bg-blue-50 flex items-center justify-center">
          <AppLogoTooth />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight flex items-center gap-2">
            AlignView 3D
          </h1>
          <p className="text-xs font-medium text-slate-400">
            View <span className="text-slate-300">•</span> Compare <span className="text-slate-300">•</span> Analyze
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Upload Custom STL */}
        <button
          id="btn-header-upload"
          onClick={() => openUploadModal('upper')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
          title="Upload custom STL file"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Upload STL</span>
        </button>

        {/* Reset View */}
        <button
          id="btn-header-reset-view"
          onClick={triggerResetView}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset View</span>
        </button>

        {/* Screenshot */}
        <button
          id="btn-header-screenshot"
          onClick={triggerScreenshot}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
        >
          <Camera className="w-3.5 h-3.5 text-slate-500" />
          <span>Screenshot</span>
        </button>

        {/* Full Screen */}
        <button
          id="btn-header-fullscreen"
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
        >
          {isFullscreen ? (
            <>
              <Minimize className="w-3.5 h-3.5 text-slate-500" />
              <span>Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize className="w-3.5 h-3.5 text-slate-500" />
              <span>Full Screen</span>
            </>
          )}
        </button>

        {/* Export View */}
        <button
          id="btn-header-export"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-sm shadow-blue-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export View</span>
        </button>
      </div>
    </header>
  );
};
