'use client';

import React from 'react';
import { Zap, Layers, Cpu, Ruler, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

const METRICS = [
  {
    value: '60 FPS',
    unit: 'PERFORMANCE',
    label: 'GPU Hardware Render',
    description: 'WebGL 2.0 engine with PBR material shaders and studio floor reflections.',
    badge: '16.6ms Frame Budget',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    gradient: 'from-amber-500/20 to-transparent',
  },
  {
    value: '32 Stages',
    unit: 'BIOMECHANICS',
    label: 'Aligner Trajectory',
    description: 'Dynamic parametric torque, tipping, and expansion morphing sequence.',
    badge: 'Continuous 1–32 Morphing',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    icon: <Layers className="w-5 h-5 text-blue-400" />,
    gradient: 'from-blue-500/20 to-transparent',
  },
  {
    value: '< 100 ms',
    unit: 'LATENCY',
    label: 'Instant STL Ingestion',
    description: 'Ultra-fast binary & ASCII parser executing purely in client-side RAM.',
    badge: '100% Client-Side / Zero Lag',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    icon: <Cpu className="w-5 h-5 text-purple-400" />,
    gradient: 'from-purple-500/20 to-transparent',
  },
  {
    value: '0.01 mm',
    unit: 'PRECISION',
    label: 'Laser Caliper Raycasting',
    description: 'Point-to-point 3D Euclidean measurement across anatomical crowns.',
    badge: 'Sub-Millimeter Accuracy',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: <Ruler className="w-5 h-5 text-emerald-400" />,
    gradient: 'from-emerald-500/20 to-transparent',
  },
];

export const MetricsSection: React.FC = () => {
  return (
    <section id="metrics" className="py-16 sm:py-24 bg-[#F4F6FA] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unified High-Performance Studio Showcase Card */}
        <div className="relative rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-8 sm:p-12 overflow-hidden">
          
          {/* Ambient Lighting Flares inside the container */}
          <div className="absolute top-0 left-1/4 w-96 h-40 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header inside card */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-8 border-b border-slate-800/80 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-3">
                <Activity className="w-3.5 h-3.5" />
                <span>Engine Performance Telemetry</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Engineered for Speed, Precision & Privacy
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              Real-time hardware acceleration delivering desktop CAD performance directly inside any modern web browser.
            </p>
          </div>

          {/* 4 Performance Metric Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {METRICS.map((item, idx) => (
              <div 
                key={idx} 
                className="relative rounded-2xl p-6 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group hover:bg-slate-900/90"
              >
                <div>
                  {/* Icon & Live Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                      {item.unit}
                    </span>
                  </div>

                  {/* Big Glowing Metric Number */}
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1 group-hover:text-blue-200 transition-colors">
                    {item.value}
                  </div>

                  {/* Label */}
                  <div className="text-xs font-bold text-slate-300 mb-2">
                    {item.label}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Status Pill */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${item.badgeColor}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{item.badge}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
