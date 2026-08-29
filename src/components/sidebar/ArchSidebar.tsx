'use client';

import React, { useState } from 'react';
import { Search, MoreVertical, Plus, Trash2, CheckCircle2 } from 'lucide-react';
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
}

export const ArchSidebar: React.FC<ArchSidebarProps> = ({ arch }) => {
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
  } = useViewerStore();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
  };

  const themeColor = isUpper ? '#2563EB' : '#10B981'; // Blue for upper, Green for lower

  return (
    <aside className="w-72 h-full bg-white border-r border-slate-200/80 last:border-r-0 last:border-l flex flex-col select-none shrink-0">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ArchToothIcon color={themeColor} />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            {isUpper ? 'Upper Arch' : 'Lower Arch'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {files.length} files
          </span>
          <button
            onClick={() => openUploadModal(arch)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title={`Add ${isUpper ? 'Upper' : 'Lower'} STL`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
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

          return (
            <div
              key={file.id}
              onClick={() => handleSelect(file)}
              className={`group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500/80 shadow-sm'
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200/60'
              }`}
            >
              {/* 3D Model Thumbnail */}
              <ArchThumbnail arch={arch} />

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${
                  isSelected ? 'text-blue-900' : 'text-slate-800 group-hover:text-slate-900'
                }`}>
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
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
          <div className="p-6 text-center text-xs text-slate-400">
            No STL files found
          </div>
        )}
      </div>
    </aside>
  );
};
