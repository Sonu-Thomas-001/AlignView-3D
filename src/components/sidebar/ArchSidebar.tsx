'use client';

import React, { useState } from 'react';
import { Search, MoreVertical, Plus, Trash2, CheckCircle2, X, RotateCcw, Upload, AlertTriangle } from 'lucide-react';
import { useViewerStore } from '@/store/useViewerStore';
import { STLFileInfo } from '@/types/dental';

// Jaw Arch Thumbnail SVG Generator
const ArchThumbnail = ({ arch }: { arch: 'upper' | 'lower' }) => {
  const isUpper = arch === 'upper';
  return (
    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
      <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
        {/* Soft Gum Arch base */}
        <path
          d={
            isUpper
              ? "M 8 28 C 8 14 32 14 32 28 C 28 26 24 23 20 23 C 16 23 12 26 8 28 Z"
              : "M 8 12 C 8 26 32 26 32 12 C 28 14 24 17 20 17 C 16 17 12 14 8 12 Z"
          }
          fill="#F472B6"
          opacity="0.8"
        />
        {/* Teeth curve */}
        <path
          d={
            isUpper
              ? "M 10 26 C 10 16 30 16 30 26"
              : "M 10 14 C 10 24 30 24 30 14"
          }
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="1.5, 3"
        />
      </svg>
    </div>
  );
};

// Tooth icon matching header/sidebar
const ArchToothIcon = ({ color }: { color: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="w-4 h-4"
  >
    <path d="M12 3C8.5 3 6 5 6 8.5c0 4 2 6 2.5 10 .5 4 3 4.5 3.5 4.5s3-.5 3.5-4.5c.5-4 2.5-6 2.5-10C18 5 15.5 3 12 3z" />
    <path d="M12 3v5" />
  </svg>
);

interface ArchSidebarProps {
  arch: 'upper' | 'lower';
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const ArchSidebar: React.FC<ArchSidebarProps> = ({ 
  arch, 
  isMobileDrawer = false, 
  onCloseMobileDrawer 
}) => {
  const isUpper = arch === 'upper';
  const {
    upperFiles,
    lowerFiles,
    selectedUpperId,
    selectedLowerId,
    setSelectedUpperId,
    setSelectedLowerId,
    searchUpper,
    searchLower,
    setSearchUpper,
    setSearchLower,
    setCurrentStep,
    openUploadModal,
    deleteSTL,
    deleteAllSTLs,
    resetDefaultSTLs,
  } = useViewerStore();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);

  const files = isUpper ? upperFiles : lowerFiles;
  const selectedId = isUpper ? selectedUpperId : selectedLowerId;
  const searchQuery = isUpper ? searchUpper : searchLower;
  const setSearch = isUpper ? setSearchUpper : setSearchLower;

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (file: STLFileInfo) => {
    if (isUpper) {
      setSelectedUpperId(file.id);
    } else {
      setSelectedLowerId(file.id);
    }
    // Sync treatment step if file corresponds to a stage
    if (file.stage) {
      setCurrentStep(file.stage);
    }
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const handleDeleteAll = () => {
    deleteAllSTLs(arch);
    setShowConfirmDeleteAll(false);
  };

  const themeColor = isUpper ? '#2563EB' : '#10B981';

  return (
    <aside className="w-full sm:w-72 h-full bg-white flex flex-col select-none shrink-0 relative">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ArchToothIcon color={themeColor} />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            {isUpper ? 'Upper Arch' : 'Lower Arch'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 relative">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {files.length} files
          </span>

          {/* Add STL Button */}
          <button
            id={`btn-add-${arch}-stl`}
            onClick={() => openUploadModal(arch)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title={`Add ${isUpper ? 'Upper' : 'Lower'} STL`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Delete All STLs Icon Button */}
          <div className="relative">
            <button
              id={`btn-delete-all-${arch}`}
              onClick={() => {
                if (files.length > 0) {
                  setShowConfirmDeleteAll(prev => !prev);
                }
              }}
              disabled={files.length === 0}
              className={`p-1.5 rounded-lg transition-colors ${
                files.length === 0
                  ? 'text-slate-200 cursor-not-allowed'
                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
              }`}
              title={files.length > 0 ? `Delete all ${isUpper ? 'Upper' : 'Lower'} STLs` : `No ${isUpper ? 'Upper' : 'Lower'} STLs to delete`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Confirm Delete All Popover */}
            {showConfirmDeleteAll && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-floating border border-slate-200 p-3.5 z-40 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Delete all {isUpper ? 'Upper' : 'Lower'} STLs?
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      This will remove all {files.length} {isUpper ? 'upper' : 'lower'} STL files from the viewer.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowConfirmDeleteAll(false)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete All</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {isMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ml-0.5"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isUpper ? "Search upper STLs..." : "Search lower STLs..."}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredFiles.map((file) => {
          const isSelected = file.id === selectedId;
          const isMenuOpen = activeMenuId === file.id;
          const stageFormatted = file.stage ? file.stage.toString().padStart(2, '0') : null;
          const isTemplate = /template/i.test(file.name);

          return (
            <div
              key={file.id}
              onClick={() => handleSelect(file)}
              className={`group relative flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? isUpper
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200/60'
              }`}
            >
              {/* 3D Model Thumbnail */}
              <ArchThumbnail arch={arch} />

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 justify-between">
                  <p className={`text-xs font-bold truncate ${
                    isSelected 
                      ? (isUpper ? 'text-blue-950' : 'text-emerald-950') 
                      : 'text-slate-800 group-hover:text-slate-900'
                  }`}>
                    {isTemplate 
                      ? `Stage ${stageFormatted || '01'} (Template)` 
                      : stageFormatted 
                      ? `Stage ${stageFormatted}` 
                      : file.name}
                  </p>
                  {stageFormatted && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isTemplate
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : isSelected
                        ? isUpper ? 'bg-blue-200/70 text-blue-800' : 'bg-emerald-200/70 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isTemplate ? 'Template' : `#${stageFormatted}`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate font-normal">
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {file.date} <span className="text-slate-300">•</span> {file.fileSize}
                </p>
              </div>

              {/* Kebab Options Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : file.id);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors opacity-80 group-hover:opacity-100"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-floating border border-slate-200/80 py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => {
                        handleSelect(file);
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>Select Arch</span>
                    </button>
                    <button
                      onClick={() => {
                        deleteSTL(arch, file.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete File</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredFiles.length === 0 && (
          <div className="p-4 text-center text-xs">
            {files.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 px-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                  <ArchToothIcon color="#94A3B8" />
                </div>
                <p className="font-semibold text-slate-700">
                  No {isUpper ? 'Upper' : 'Lower'} STLs
                </p>
                <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
                  All {isUpper ? 'upper' : 'lower'} arch files have been deleted. You can upload custom scans or restore default samples.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2 mt-3 w-full max-w-[210px]">
                  <button
                    onClick={() => openUploadModal(arch)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload STL</span>
                  </button>
                  <button
                    onClick={() => resetDefaultSTLs(arch)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    <span>Restore</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-slate-400">
                <p>No STLs matching &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-2 text-blue-600 hover:underline text-xs"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
