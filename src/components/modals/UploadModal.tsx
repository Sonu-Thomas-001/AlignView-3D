'use client';

import React, { useState, useRef } from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { Upload, X, FileCheck, AlertCircle } from 'lucide-react';
import { STLLoader } from 'three-stdlib';
import * as THREE from 'three';

export const UploadModal: React.FC = () => {
  const { 
    isUploadModalOpen, 
    closeUploadModal, 
    uploadArchTarget, 
    addCustomSTL 
  } = useViewerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.stl')) {
      setError('Please select a valid binary or ASCII .stl dental model file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const loader = new STLLoader();
      const geometry = loader.parse(buffer);
      geometry.computeVertexNormals();
      geometry.center();

      // Compute bounding box dimensions
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox || new THREE.Box3();
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const pos = geometry.attributes.position;
      const vertCount = pos.count;
      const triCount = geometry.index ? geometry.index.count / 3 : vertCount / 3;

      const newSTL = {
        id: `custom_${Date.now()}`,
        name: file.name,
        arch: uploadArchTarget,
        stage: 1,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        verticesCount: vertCount,
        trianglesCount: Math.round(triCount),
        dimensions: {
          width: parseFloat(size.x.toFixed(1)),
          depth: parseFloat(size.z.toFixed(1)),
          height: parseFloat(size.y.toFixed(1)),
        },
        customBufferGeometry: geometry,
      };

      addCustomSTL(uploadArchTarget, newSTL);
      setLoading(false);
      closeUploadModal();
    } catch (err: any) {
      console.error(err);
      setError('Failed to parse STL file. Please check file format.');
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Upload {uploadArchTarget === 'upper' ? 'Upper' : 'Lower'} Arch STL
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add your dental scan or treatment stage model
            </p>
          </div>
          <button
            onClick={closeUploadModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Dropzone */}
        <div className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".stl"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 text-center">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-slate-400 mt-1 text-center">
              Supports binary or ASCII .STL files (Max 50MB)
            </p>
          </div>

          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Parsing 3D STL mesh & calculating geometry...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
