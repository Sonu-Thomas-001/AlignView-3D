'use client';

import React from 'react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Shield, Lock, Cpu, ServerOff, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <LandingNavbar />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/90 text-blue-800 text-xs font-bold mb-4">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Security & Sandbox Architecture</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Security Architecture
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              How AlignView 3D protects clinician and patient data through zero-knowledge client-side sandboxing.
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200/90 shadow-sm space-y-10 text-xs sm:text-sm text-slate-700 leading-relaxed">
            
            {/* Grid Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
                <div>
                  <Cpu className="w-6 h-6 text-blue-600 mb-3" />
                  <h3 className="font-bold text-slate-900 text-sm">Local Execution</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    WebGL 2.0 computations run on the client GPU.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
                <div>
                  <ServerOff className="w-6 h-6 text-emerald-600 mb-3" />
                  <h3 className="font-bold text-slate-900 text-sm">Zero Network Sync</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Mesh buffers are isolated from remote servers.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col justify-between">
                <div>
                  <Lock className="w-6 h-6 text-purple-600 mb-3" />
                  <h3 className="font-bold text-slate-900 text-sm">Client Sandboxing</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Protected by modern browser security models.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Ingestion Security */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">1</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">File Ingestion & Memory Management</h2>
              </div>
              <p>
                Imported binary and ASCII STL files are loaded into browser-managed ArrayBuffers. When a tab is closed or a file is cleared, all memory references are garbage collected immediately.
              </p>
            </section>

            {/* Section 2: Code Security & Integrity */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">2</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Proprietary Code Protection</h2>
              </div>
              <p>
                All proprietary mathematical algorithms, 3D transformation matrices, and shader source code are protected by intellectual property laws and strict non-commercial licensing constraints.
              </p>
            </section>

          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
