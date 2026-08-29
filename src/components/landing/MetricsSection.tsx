'use client';

import React from 'react';
import { Zap, Activity, Cpu, ShieldCheck } from 'lucide-react';

const METRICS = [
  {
    value: '60 FPS',
    label: 'Smooth Rendering',
    description: 'Hardware-accelerated Three.js WebGL rendering with studio softbox reflections.',
    icon: <Zap className="w-5 h-5 text-amber-500" />,
  },
  {
    value: '32 Stages',
    label: 'Continuous Sequence',
    description: 'Dynamic interpolation through full aligner rotation and translation stages.',
    icon: <Activity className="w-5 h-5 text-blue-500" />,
  },
  {
    value: '< 100 ms',
    label: 'Instant Parsing',
    description: 'Ultra-fast binary & ASCII STL ingestion calculated purely on client device.',
    icon: <Cpu className="w-5 h-5 text-purple-500" />,
  },
  {
    value: '0.01 mm',
    label: 'Measurement Precision',
    description: 'High-precision 3D raycasting caliper for tooth width & interproximal spacing.',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
  },
];

export const MetricsSection: React.FC = () => {
  return (
    <section id="metrics" className="py-20 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {METRICS.map((item, idx) => (
            <div 
              key={idx} 
              className="p-6 rounded-3xl bg-slate-50 border border-slate-200/70 hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center mb-4 shadow-sm">
                  {item.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                  {item.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                  {item.label}
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
