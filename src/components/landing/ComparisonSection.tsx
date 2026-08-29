'use client';

import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface FeatureComparison {
  feature: string;
  alignView: boolean | string;
  legacyCAD: boolean | string;
}

const COMPARISONS: FeatureComparison[] = [
  { feature: 'Installation Requirement', alignView: 'Zero (Pure WebGL)', legacyCAD: '10GB+ Heavy Desktop App' },
  { feature: 'Startup & Loading Time', alignView: '< 800ms Instant', legacyCAD: '2 - 5 Minutes' },
  { feature: 'Continuous 32-Stage Aligner Playback', alignView: true, legacyCAD: false },
  { feature: 'Multi-Shader Modes (PBR, Wireframe, X-Ray)', alignView: true, legacyCAD: 'Limited' },
  { feature: 'Sub-Millimeter 3D Point Caliper', alignView: true, legacyCAD: true },
  { feature: 'Mobile & Tablet Browser Support', alignView: true, legacyCAD: false },
  { feature: 'Client-Side HIPAA-Friendly Security', alignView: true, legacyCAD: 'Varies' },
  { feature: 'License Cost', alignView: '100% Free & Open Source', legacyCAD: '$2,000 - $5,000 / Year' },
];

export const ComparisonSection: React.FC = () => {
  return (
    <section id="comparison" className="py-24 sm:py-32 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Comparison
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
            Why Modern Clinics Choose AlignView 3D
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Compare the lightweight web-native experience against legacy dental software.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="py-5 px-6 text-sm font-bold text-slate-800">Key Capability</th>
                  <th className="py-5 px-6 text-sm font-extrabold text-blue-600 bg-blue-50/50">
                    AlignView 3D
                  </th>
                  <th className="py-5 px-6 text-sm font-semibold text-slate-500">
                    Legacy Desktop CAD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {COMPARISONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">
                      {row.feature}
                    </td>

                    {/* AlignView 3D Value */}
                    <td className="py-4 px-6 font-bold text-slate-900 bg-blue-50/20">
                      {typeof row.alignView === 'boolean' ? (
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-blue-700 font-semibold">{row.alignView}</span>
                      )}
                    </td>

                    {/* Legacy CAD Value */}
                    <td className="py-4 px-6 text-slate-500">
                      {typeof row.legacyCAD === 'boolean' ? (
                        row.legacyCAD ? (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )
                      ) : (
                        <span>{row.legacyCAD}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};
