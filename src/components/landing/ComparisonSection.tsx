'use client';

import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Ruler, 
  Smartphone, 
  DollarSign, 
  AlertCircle,
  Flame
} from 'lucide-react';
import Link from 'next/link';

interface MatrixRow {
  category: 'speed' | 'clinical' | 'mobility' | 'cost';
  feature: string;
  alignView: string | boolean;
  alignViewDetail: string;
  legacyCAD: string | boolean;
  legacyCADDetail: string;
}

const MATRIX_DATA: MatrixRow[] = [
  // Speed & Architecture
  {
    category: 'speed',
    feature: 'Installation & Setup',
    alignView: 'Zero Install (Web-Native)',
    alignViewDetail: 'Runs instantly in modern browsers via WebGL',
    legacyCAD: '10GB+ Desktop Package',
    legacyCADDetail: 'Requires OS administrator installation & drivers',
  },
  {
    category: 'speed',
    feature: 'App Startup Time',
    alignView: '< 800 ms',
    alignViewDetail: 'Turbopack optimized instant client-side boot',
    legacyCAD: '2 – 5 Minutes',
    legacyCADDetail: 'Slow dongle / license server verification',
  },
  {
    category: 'speed',
    feature: 'Rendering Engine',
    alignView: '60 FPS WebGL / Three.js',
    alignViewDetail: 'Hardware accelerated with studio softbox reflections',
    legacyCAD: 'Proprietary Direct3D / OpenGL',
    legacyCADDetail: 'Heavy CPU & GPU requirements',
  },

  // Clinical & Aligner Diagnostics
  {
    category: 'clinical',
    feature: '32-Stage Aligner Morphing',
    alignView: true,
    alignViewDetail: 'Continuous dynamic trajectory with rotational torque',
    legacyCAD: false,
    legacyCADDetail: 'Static file-by-file loading without fluid morphing',
  },
  {
    category: 'clinical',
    feature: 'Sub-Millimeter 3D Caliper',
    alignView: '0.01 mm Precision',
    alignViewDetail: 'Live point-to-point Euclidean raycasting',
    legacyCAD: 'Available',
    legacyCADDetail: 'Requires multiple sub-menu tool clicks',
  },
  {
    category: 'clinical',
    feature: 'Multi-Shader Diagnostics',
    alignView: '4 Modes (PBR, Wire, Clay, X-Ray)',
    alignViewDetail: 'Instant single-click toggle in viewport',
    legacyCAD: 'Limited Shaders',
    legacyCADDetail: 'Complex material setup dialogs',
  },

  // Mobility & Access
  {
    category: 'mobility',
    feature: 'Mobile & iPad Touch Support',
    alignView: true,
    alignViewDetail: 'Full multi-touch orbit, zoom, pan & slide drawers',
    legacyCAD: false,
    legacyCADDetail: 'Desktop workstation only (Windows/macOS)',
  },
  {
    category: 'mobility',
    feature: 'Client-Side Data Privacy',
    alignView: '100% Local / Zero Server Upload',
    alignViewDetail: 'HIPAA & GDPR safe; meshes never leave device',
    legacyCAD: 'Varies',
    legacyCADDetail: 'May require cloud syncing & account logins',
  },

  // Cost & Licensing
  {
    category: 'cost',
    feature: 'Pricing & Licensing',
    alignView: '$0 / 100% Free & Open Source',
    alignViewDetail: 'MIT License for clinics, labs & developers',
    legacyCAD: '$2,000 – $5,000 / Year',
    legacyCADDetail: 'Recurring seat license fees & maintenance contracts',
  },
];

type CategoryTab = 'all' | 'speed' | 'clinical' | 'mobility' | 'cost';

export const ComparisonSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');

  const filteredRows = activeTab === 'all' 
    ? MATRIX_DATA 
    : MATRIX_DATA.filter(r => r.category === activeTab);

  return (
    <section id="comparison" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Modern Web vs. Traditional CAD</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Why Modern Clinics Choose AlignView 3D
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Compare our frictionless, web-native 3D architecture against legacy desktop dental CAD software.
          </p>
        </div>

        {/* Top 2 Battle Cards: AlignView 3D vs. Legacy CAD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          
          {/* Card 1: AlignView 3D (The Modern Winner) */}
          <div className="relative rounded-3xl bg-gradient-to-b from-blue-50/90 via-white to-white p-8 sm:p-10 border-2 border-blue-500 shadow-xl shadow-blue-500/10 flex flex-col justify-between overflow-hidden">
            {/* Top Recommended Pill */}
            <div className="absolute top-5 right-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shadow-sm tracking-wide">
                <Flame className="w-3 h-3 text-amber-300" />
                MODERN STANDARD
              </span>
            </div>

            <div>
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Next-Gen Web Architecture</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-2">
                AlignView 3D
              </h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-xs font-bold text-slate-500">/ 100% Free & Open-Source Forever</span>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3.5">
                {[
                  'Zero Install • Instant WebGL browser access (< 800ms)',
                  'Continuous 32-Stage clear aligner morphing sequence',
                  'Sub-Millimeter 3D caliper raycasting (0.01 mm precision)',
                  '4 Diagnostic shaders (PBR Shaded, Wireframe, Clay, X-Ray)',
                  '100% Client-side local execution (HIPAA & GDPR safe)',
                  'Full touch gesture support on iPads, tablets & smartphones',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-800">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/studio"
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <span>Launch Live 3D Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Legacy Desktop CAD (Traditional Approach) */}
          <div className="relative rounded-3xl bg-slate-50/80 p-8 sm:p-10 border border-slate-200/90 shadow-sm flex flex-col justify-between text-slate-600">
            <div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Traditional Software</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-1 mb-2">
                Legacy Desktop CAD
              </h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-700">$3,500+</span>
                <span className="text-xs font-bold text-slate-400">/ Annual recurring license per seat</span>
              </div>

              {/* Drawback Checklist */}
              <div className="space-y-3.5 text-xs sm:text-sm">
                {[
                  '10GB+ heavy OS desktop installation package required',
                  'Slow 2–5 minute startup and license dongle verification',
                  'Static file loading with no continuous aligner morphing',
                  'Limited shader modes with complex setup menus',
                  'High license fees and recurring maintenance charges',
                  'Zero iPad or mobile smartphone touchscreen support',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-slate-500">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/60">
              <div className="py-3 px-4 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs font-semibold text-slate-500">
                High hardware overhead & steep learning curve
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Breakdown Matrix Card */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-slate-50/90 border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <h4 className="text-base font-extrabold text-slate-900">
              Feature-by-Feature Deep Dive
            </h4>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Features' },
                { id: 'speed', label: 'Speed & Setup' },
                { id: 'clinical', label: 'Clinical Tools' },
                { id: 'mobility', label: 'Mobility & Security' },
                { id: 'cost', label: 'Cost' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as CategoryTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Rows */}
          <div className="space-y-3">
            {filteredRows.map((row, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:border-blue-200 transition-colors"
              >
                {/* Feature Name */}
                <div className="md:col-span-4">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                    {row.feature}
                  </span>
                  <span className="text-[11px] text-slate-400 capitalize">
                    {row.category} category
                  </span>
                </div>

                {/* AlignView 3D Column */}
                <div className="md:col-span-4 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                  <div className="flex items-center gap-2">
                    {typeof row.alignView === 'boolean' ? (
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-xs font-extrabold text-blue-900">{row.alignView}</span>
                    )}
                    <span className="text-xs font-bold text-blue-700">AlignView 3D</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {row.alignViewDetail}
                  </p>
                </div>

                {/* Legacy CAD Column */}
                <div className="md:col-span-4 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    {typeof row.legacyCAD === 'boolean' ? (
                      row.legacyCAD ? (
                        <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                          <X className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )
                    ) : (
                      <span className="text-xs font-bold text-slate-700">{row.legacyCAD}</span>
                    )}
                    <span className="text-xs font-semibold text-slate-500">Legacy CAD</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {row.legacyCADDetail}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
