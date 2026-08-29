'use client';

import React from 'react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { ShieldCheck, Lock, EyeOff, ServerOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <LandingNavbar />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-bold mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Privacy by Architecture</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy & HIPAA Statement
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Last Updated: August 29, 2026. AlignView 3D is designed with zero-knowledge, 100% client-side data isolation.
            </p>
          </div>

          {/* Privacy Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200/90 shadow-sm space-y-10 text-xs sm:text-sm text-slate-700 leading-relaxed">
            
            {/* Highlight Banner */}
            <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ServerOff className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-900">Zero Server Data Retention Policy</h2>
                <p className="text-xs sm:text-sm text-emerald-800/90 mt-1">
                  Your 3D dental scan files (.stl, .obj), patient records, measurements, and mesh geometry are NEVER uploaded to any remote server or cloud database.
                </p>
              </div>
            </div>

            {/* Section 1: Data Processing */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">1</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">100% Local Browser WebGL Sandboxing</h2>
              </div>
              <p>
                When you drag and drop or import 3D dental STL files into AlignView 3D, all file reading, binary parsing, polygon vertex calculations, and WebGL buffer creation execute entirely inside your local device’s browser memory (RAM).
              </p>
            </section>

            {/* Section 2: HIPAA & GDPR Compliance */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">2</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">HIPAA & GDPR Compliance by Design</h2>
              </div>
              <p>
                Because no Protected Health Information (PHI) or Personally Identifiable Information (PII) is transmitted over the network or stored remotely, clinics and orthodontic labs maintain full compliance with:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">HIPAA Security Rule</strong>
                    <span className="text-slate-500 text-xs">No PHI transmission or cloud exposure.</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">GDPR Compliance</strong>
                    <span className="text-slate-500 text-xs">Zero personal data collection or tracking.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Telemetry & Analytics */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">3</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Analytics & Cookies</h2>
              </div>
              <p>
                AlignView 3D does not use tracking cookies, cross-site trackers, or third-party marketing beacons. Your session is completely private.
              </p>
            </section>

          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
