'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  Eye, 
  PlayCircle, 
  Download, 
  Check, 
  ArrowRight,
  Shield,
  Layers,
  Ruler
} from 'lucide-react';
import Link from 'next/link';

interface WorkflowStep {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  highlights: string[];
  icon: React.ReactNode;
}

const STEPS: WorkflowStep[] = [
  {
    id: 'ingest',
    stepNumber: '01',
    title: 'Ingest & Automatic Validation',
    subtitle: 'Drag & Drop Clinical STL Files',
    description: 'Instantly ingest upper and lower dental arch scans. The system computes surface vertex counts, triangle densities, bounding boxes, and detects manifold errors automatically.',
    badge: 'Zero Upload Latency',
    highlights: [
      'Client-side instant STL parsing via Web Workers',
      'Automatic bounding box (Width × Depth × Height) metrics',
      'Dual-arch sequence organization for clear aligner batches',
    ],
    icon: <Upload className="w-5 h-5 text-blue-600" />,
  },
  {
    id: 'diagnose',
    stepNumber: '02',
    title: 'Occlusion & Cross-Section Diagnostics',
    subtitle: 'Deep Surface & Internal Slicing',
    description: 'Inspect Class I, II, and III occlusal contacts. Activate clipping planes to section through enamel crowns and examine tooth wall thicknesses.',
    badge: 'Precision Diagnostic',
    highlights: [
      'Multi-axis X, Y, Z dynamic clipping slider',
      'Split-view comparison mode (Initial vs Current Stage)',
      'Sub-millimeter point-to-point caliper raycasting',
    ],
    icon: <Ruler className="w-5 h-5 text-emerald-600" />,
  },
  {
    id: 'simulate',
    stepNumber: '03',
    title: '32-Stage Aligner Simulation',
    subtitle: 'Dynamic Biomechanical Playback',
    description: 'Scrub through all 32 aligner progression stages. Watch teeth rotate, translate, and uncrowd smoothly with variable playback speed (0.5x to 2.5x) and looping.',
    badge: 'Continuous Morphing',
    highlights: [
      'Real-time smooth biomechanical torque interpolation',
      'Scrubber slider with discrete stage tick indicators',
      'Interactive speed control and automated animation loop',
    ],
    icon: <PlayCircle className="w-5 h-5 text-purple-600" />,
  },
  {
    id: 'export',
    stepNumber: '04',
    title: 'High-Res Export & Team Sharing',
    subtitle: 'Presentation-Ready Clinical Artifacts',
    description: 'Capture high-definition canvas screenshots with transparent or studio studio backgrounds for patient consultations, lab handoffs, and orthodontic case presentations.',
    badge: 'Instant Delivery',
    highlights: [
      'One-click high-resolution PNG snapshot download',
      'Telemetry metadata watermarking for case files',
      'Universal compatibility across mobile and desktop viewers',
    ],
    icon: <Download className="w-5 h-5 text-sky-600" />,
  },
];

export const WorkflowSection: React.FC = () => {
  const [activeStepId, setActiveStepId] = useState<string>('simulate');
  const activeStep = STEPS.find(s => s.id === activeStepId) || STEPS[0];

  return (
    <section id="workflow" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            Clinical Workflow
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
            From Raw STL to Clinical Simulation in 4 Steps
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            A frictionless, streamlined workflow designed for digital orthodontics clinics and dental CAD/CAM laboratories.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
          {STEPS.map((step) => {
            const isActive = step.id === activeStepId;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                }`}
              >
                <span className={`text-xs font-extrabold block mb-1 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                  STEP {step.stepNumber}
                </span>
                <span className="text-xs sm:text-sm font-bold block truncate">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Card */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-50 border border-slate-200/80 p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="md:col-span-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-blue-700 text-xs font-bold shadow-xs">
                  {activeStep.badge}
                </span>
                <span className="text-xs font-semibold text-slate-400">Step {activeStep.stepNumber} of 04</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeStep.title}
              </h3>
              <p className="text-sm font-semibold text-blue-600 mt-1 mb-4">
                {activeStep.subtitle}
              </p>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {activeStep.description}
              </p>

              <div className="space-y-2.5">
                {activeStep.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs sm:text-sm font-medium text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  <span>Try this in 3D Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Visual Badge Representation */}
            <div className="md:col-span-5 flex items-center justify-center">
              <div className="w-full aspect-square max-w-[280px] rounded-3xl bg-white border border-slate-200/80 shadow-md p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 shadow-inner">
                  {activeStep.icon}
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">
                  Step {activeStep.stepNumber} Active
                </h4>
                <p className="text-xs text-slate-500">
                  Interactive real-time execution in browser
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 w-full flex justify-around text-[10px] font-bold text-slate-400">
                  <span>60 FPS</span>
                  <span>•</span>
                  <span>WebGL 2.0</span>
                  <span>•</span>
                  <span>100% Private</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
