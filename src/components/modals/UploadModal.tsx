'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { 
  Upload, 
  X, 
  FileCheck, 
  AlertCircle, 
  User, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  FolderOpen,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { STLLoader } from 'three-stdlib';
import * as THREE from 'three';
import { parseSTLFilename, detectBatchPatientName, sortSTLFilesByStage, normalizeDentalGeometry } from '@/utils/stlParser';
import { STLFileInfo } from '@/types/dental';

export const UploadModal: React.FC = () => {
  const { 
    isUploadModalOpen, 
    closeUploadModal, 
    uploadArchTarget, 
    addBatchSTLs,
    patientName: storePatientName,
  } = useViewerStore();

  const [selectedArchMode, setSelectedArchMode] = useState<'auto' | 'upper' | 'lower'>(uploadArchTarget || 'auto');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFileName: '' });
  const [error, setError] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);

  // Staged files waiting for confirmation
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [detectedPatient, setDetectedPatient] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Sync mode when modal opens
  React.useEffect(() => {
    if (isUploadModalOpen) {
      setSelectedArchMode(uploadArchTarget || 'auto');
      setStagedFiles([]);
      setError(null);
      setLoading(false);
    }
  }, [isUploadModalOpen, uploadArchTarget]);

  // Analyzed staged files breakdown
  const analysis = useMemo(() => {
    if (stagedFiles.length === 0) return null;

    const upperList: { file: File; stage?: number; name: string; isTemplate: boolean }[] = [];
    const lowerList: { file: File; stage?: number; name: string; isTemplate: boolean }[] = [];
    const unknownList: { file: File; stage?: number; name: string; isTemplate: boolean }[] = [];

    for (const f of stagedFiles) {
      const meta = parseSTLFilename(f.name);
      const isTemplate = meta.isTemplate || /template/i.test(f.name);
      const targetArch = selectedArchMode !== 'auto' ? selectedArchMode : meta.arch;

      if (targetArch === 'upper') {
        upperList.push({ file: f, stage: meta.stage, name: f.name, isTemplate });
      } else if (targetArch === 'lower') {
        lowerList.push({ file: f, stage: meta.stage, name: f.name, isTemplate });
      } else {
        unknownList.push({ file: f, stage: meta.stage, name: f.name, isTemplate });
      }
    }

    const upperStages = upperList.map(u => u.stage).filter((s): s is number => s !== undefined).sort((a, b) => a - b);
    const lowerStages = lowerList.map(l => l.stage).filter((s): s is number => s !== undefined).sort((a, b) => a - b);

    const upperTemplates = upperList.filter(u => u.isTemplate).length;
    const lowerTemplates = lowerList.filter(l => l.isTemplate).length;

    return {
      upperCount: upperList.length,
      lowerCount: lowerList.length,
      unknownCount: unknownList.length,
      upperTemplates,
      lowerTemplates,
      upperStageRange: upperStages.length > 0 ? `${upperStages[0]} → ${upperStages[upperStages.length - 1]}` : null,
      lowerStageRange: lowerStages.length > 0 ? `${lowerStages[0]} → ${lowerStages[lowerStages.length - 1]}` : null,
      totalFiles: stagedFiles.length,
    };
  }, [stagedFiles, selectedArchMode]);

  if (!isUploadModalOpen) return null;

  const handleFilesSelected = (files: FileList | File[]) => {
    const stlFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.stl')) {
        stlFiles.push(file);
      }
    }

    if (stlFiles.length === 0) {
      setError('Please select valid .stl 3D dental model files.');
      return;
    }

    setError(null);
    setStagedFiles(stlFiles);

    // Auto-detect patient name
    const detectedName = detectBatchPatientName(stlFiles.map(f => f.name));
    setDetectedPatient(detectedName || storePatientName || 'Patient Case');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Process all staged files into Three.js geometries and store
  const processAndImportFiles = async () => {
    if (stagedFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: stagedFiles.length, currentFileName: '' });

    const upperSTLs: STLFileInfo[] = [];
    const lowerSTLs: STLFileInfo[] = [];

    const loader = new STLLoader();

    try {
      for (let i = 0; i < stagedFiles.length; i++) {
        const file = stagedFiles[i];
        setProgress({
          current: i + 1,
          total: stagedFiles.length,
          currentFileName: file.name,
        });

        // Yield to let the UI update progress bar smoothly
        await new Promise(resolve => setTimeout(resolve, 10));

        const meta = parseSTLFilename(file.name);
        const resolvedArch: 'upper' | 'lower' = selectedArchMode !== 'auto' 
          ? selectedArchMode 
          : (meta.arch === 'lower' ? 'lower' : 'upper'); // default unassigned to upper

        const isTemplate = meta.isTemplate || /template/i.test(file.name);

        const buffer = await file.arrayBuffer();
        let geometry = loader.parse(buffer);
        geometry = normalizeDentalGeometry(geometry, resolvedArch);

        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox || new THREE.Box3();
        const size = new THREE.Vector3();
        bbox.getSize(size);

        const pos = geometry.attributes.position;
        const vertCount = pos.count;
        const triCount = geometry.index ? geometry.index.count / 3 : vertCount / 3;

        const stlInfo: STLFileInfo = {
          id: `stl_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          arch: resolvedArch,
          stage: meta.stage ?? (isTemplate ? 1 : i + 1),
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          verticesCount: vertCount,
          trianglesCount: Math.round(triCount),
          dimensions: {
            width: parseFloat(size.x.toFixed(1)),
            depth: parseFloat(size.z.toFixed(1)),
            height: parseFloat(size.y.toFixed(1)),
          },
          isTemplate,
          customBufferGeometry: geometry,
        };

        if (resolvedArch === 'upper') {
          upperSTLs.push(stlInfo);
        } else {
          lowerSTLs.push(stlInfo);
        }
      }

      addBatchSTLs({
        patientName: detectedPatient.trim() || storePatientName,
        upperFiles: upperSTLs,
        lowerFiles: lowerSTLs,
        replaceExisting,
      });

      setLoading(false);
      closeUploadModal();
    } catch (err: any) {
      console.error('Failed to parse STL batch:', err);
      setError('Error parsing one or more STL files. Please verify the binary/ASCII STL format.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Universal STL Batch Upload
              </h3>
              <p className="text-xs text-slate-500">
                Auto-segregates Upper & Lower jaws and detects patient name
              </p>
            </div>
          </div>
          <button
            onClick={closeUploadModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Arch Target Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Mode</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedArchMode('auto')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedArchMode === 'auto'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Auto-Segregate</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedArchMode('upper')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedArchMode === 'upper'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Upper Jaw Only</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedArchMode('lower')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedArchMode === 'lower'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Lower Jaw Only</span>
              </button>
            </div>
          </div>

          {/* Staged Files Analysis Overview or Upload Dropzone */}
          {stagedFiles.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 sm:p-9 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".stl"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesSelected(e.target.files);
                  }
                }}
                className="hidden"
              />
              
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800 text-center">
                Select or Drag & Drop STL Sequence Files
              </p>
              <p className="text-xs text-slate-400 mt-1 text-center max-w-sm">
                Select all Upper and Lower stage files at once (e.g. <span className="text-slate-600 font-medium font-mono text-[11px]">Krishnapriya Upper jaw - 02 - Model.stl</span>)
              </p>

              <div className="flex items-center gap-2 mt-4">
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-600">
                  Multiple .STL supported
                </span>
                <span className="px-2.5 py-1 bg-blue-50 rounded-lg text-[11px] font-semibold text-blue-700">
                  Auto Upper/Lower separation
                </span>
              </div>
            </div>
          ) : (
            /* Analysis & Confirmation Review Box */
            <div className="space-y-4 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
              {/* Detected Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Identified Patient Name</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={detectedPatient}
                    onChange={(e) => setDetectedPatient(e.target.value)}
                    placeholder="Enter Patient or Case Name"
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs transition-all"
                  />
                  <Sparkles className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500" />
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Upper Arch Card */}
                <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Upper Arch
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                      {analysis?.upperCount} files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {analysis?.upperStageRange ? `Stages ${analysis.upperStageRange}` : 'No upper models'}
                  </p>
                  {analysis?.upperTemplates ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-semibold self-start mt-0.5">
                      ✓ Auto-detected Template
                    </span>
                  ) : null}
                </div>

                {/* Lower Arch Card */}
                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Lower Arch
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                      {analysis?.lowerCount} files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {analysis?.lowerStageRange ? `Stages ${analysis.lowerStageRange}` : 'No lower models'}
                  </p>
                  {analysis?.lowerTemplates ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-semibold self-start mt-0.5">
                      ✓ Auto-detected Template
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Replace Option Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="replace-existing"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="replace-existing" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Replace active demo / session models with this sequence
                </label>
              </div>

              {/* Reset selection */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setStagedFiles([])}
                  className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Choose different files</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Progress State */}
          {loading && (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Processing 3D STL Geometries...</span>
                </div>
                <span>{progress.current} / {progress.total}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-blue-200/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-150 rounded-full"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>

              <p className="text-[11px] text-blue-700 truncate font-mono">
                {progress.currentFileName}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeUploadModal}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {stagedFiles.length > 0 && (
            <button
              type="button"
              onClick={processAndImportFiles}
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Import & Visualize ({stagedFiles.length} files)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
