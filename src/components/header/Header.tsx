'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RotateCcw, 
  Camera, 
  Maximize, 
  Minimize, 
  Download, 
  Upload,
  Layers,
  FolderOpen,
  LogOut,
  UserCheck,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { useViewerStore } from '@/store/useViewerStore';

const AppLogoTooth = () => (
  <img 
    src="/favicon.png" 
    alt="AlignView 3D" 
    className="w-7 h-7 sm:w-8 sm:h-8 object-contain" 
  />
);

export const Header: React.FC = () => {
  const router = useRouter();
  const { 
    triggerResetView, 
    triggerScreenshot, 
    openUploadModal,
    activeMobileDrawer,
    toggleMobileDrawer,
    upperFiles,
    lowerFiles,
    patientName,
    studioTheme,
    toggleStudioTheme,
  } = useViewerStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = studioTheme === 'dark';

  const totalFiles = upperFiles.length + lowerFiles.length;
  const hasFiles = totalFiles > 0;

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

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <header className="h-16 px-3 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between select-none z-30 shrink-0 gap-2">
      {/* Left: Brand Identity + Patient Badge + Mobile Arch Toggles */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        <a 
          href="/" 
          className="flex items-center gap-2 group"
          title="Return to Home Landing Page"
        >
          <img 
            src="/main-logo.png" 
            alt="AlignView 3D Logo" 
            className="h-9 sm:h-10 w-auto max-w-[180px] sm:max-w-[220px] object-contain group-hover:scale-105 transition-transform" 
          />
        </a>

        {/* Patient Case Badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs shadow-2xs">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold ${
            hasFiles ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
          }`}>
            {hasFiles ? <UserCheck className="w-3 h-3" /> : <User className="w-3 h-3 text-slate-400" />}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`tracking-tight ${hasFiles ? 'font-bold text-slate-800' : 'font-medium text-slate-400 italic'}`}>
              {hasFiles ? (patientName || 'Patient Case') : 'No Patient Loaded'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              hasFiles ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {totalFiles} STLs
            </span>
          </div>
        </div>



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

      {/* Right: Action Buttons + Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Upload Custom STL (Universal Batch) */}
        <button
          id="btn-header-upload"
          onClick={() => openUploadModal('auto')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-lg transition-all shadow-xs"
          title="Universal Batch Upload STL Files (Auto Upper/Lower)"
        >
          <Upload className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Upload STLs</span>
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

        {/* Theme Switcher Button */}
        <button
          id="btn-header-theme-toggle"
          onClick={toggleStudioTheme}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
          title={isDark ? 'Switch to Light Studio' : 'Switch to Dark Studio'}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline text-amber-600 font-semibold">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden lg:inline text-indigo-600 font-semibold">Dark</span>
            </>
          )}
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

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden xs:block" />

        {/* Logout Button */}
        <button
          id="btn-header-logout"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50/80 border border-slate-200 hover:border-red-200/80 rounded-lg transition-all shadow-xs cursor-pointer"
          title="Log out and return to sign in"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
