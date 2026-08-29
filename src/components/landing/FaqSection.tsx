'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  FileCode, 
  Smartphone, 
  Code2, 
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface FaqItem {
  id: string;
  category: 'biomechanics' | 'security' | 'compatibility' | 'general';
  question: string;
  answer: string;
  highlights: string[];
  icon: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    id: 'formats',
    category: 'compatibility',
    question: 'What 3D file formats does AlignView 3D support?',
    answer: 'AlignView 3D natively supports standard binary and ASCII STL (.stl) files. When you drop files into the viewer, the engine automatically calculates normal vectors, surface topology, vertex density, and bounding box dimensions in millimeters.',
    highlights: ['Binary & ASCII STL support', 'Automatic vertex & triangle count', 'Millimeter bounding box dimensions'],
    icon: <FileCode className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'privacy',
    category: 'security',
    question: 'Is patient data or 3D scan geometry uploaded to remote servers?',
    answer: 'No. AlignView 3D processes all mesh geometry 100% locally in your web browser using client-side Web Workers and WebGL buffers. No patient data, scan files, or telemetry ever leaves your device, ensuring complete HIPAA and GDPR compliance.',
    highlights: ['100% Client-side local processing', 'Zero server storage of patient files', 'HIPAA & GDPR safe by design'],
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'morphing',
    category: 'biomechanics',
    question: 'How does the 32-stage clear aligner treatment morphing work?',
    answer: 'The orthodontic engine applies parametric biomechanical trajectory equations to each tooth crown in the arch. As you scrub through stages 1 to 32, individual teeth smoothly undergo rotational torque, tipping corrections, and parabolic arch expansion at 60 frames per second.',
    highlights: ['Smooth 60 FPS real-time interpolation', 'Rotational torque & translational simulation', 'Step-by-step playback with variable speed'],
    icon: <Layers className="w-4 h-4 text-purple-600" />,
  },
  {
    id: 'export',
    category: 'general',
    question: 'Can I capture high-resolution screenshots for patient consultations?',
    answer: 'Yes. The built-in screenshot and export tool captures pixel-perfect high-resolution PNG snapshots directly from the WebGL frame buffer, complete with studio lighting, shadows, and reflection details.',
    highlights: ['One-click high-res PNG export', 'Studio softbox lighting preserved', 'Ideal for clinical case presentation'],
    icon: <Sparkles className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'devices',
    category: 'compatibility',
    question: 'Does AlignView 3D work on iPads, tablets, and mobile smartphones?',
    answer: 'Yes! The user interface is fully responsive. On tablets and mobile screens, sidebars tuck into smooth slide-over drawers, and all 3D orbit, zoom, pan, and stage scrubbing controls support native multi-touch gestures.',
    highlights: ['Fully responsive mobile/tablet layout', 'Touch gesture orbit, pan & pinch-zoom', 'Slide-over drawers for file management'],
    icon: <Smartphone className="w-4 h-4 text-sky-600" />,
  },
  {
    id: 'license',
    category: 'general',
    question: 'Can I copy, clone, or reuse the AlignView 3D source code?',
    answer: 'No. AlignView 3D is a proprietary product of MidCell Studios, authored by Sonu Thomas. All intellectual property rights belong exclusively to MidCell Studios / Sonu Thomas. You are granted access to use the web application for clinical visualization, but copying, duplicating, reverse engineering, or creating unauthorized forks/commercial clones is strictly prohibited under our Terms of Service.',
    highlights: ['Proprietary & All Rights Reserved', 'Code duplication & cloning strictly prohibited', 'Free to use via web interface'],
    icon: <Code2 className="w-4 h-4 text-indigo-600" />,
  },
];

type CategoryFilter = 'all' | 'biomechanics' | 'security' | 'compatibility' | 'general';

export const FaqSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [openIndex, setOpenIndex] = useState<string | null>('formats');

  const filteredFaqs = activeCategory === 'all' 
    ? FAQS 
    : FAQS.filter(f => f.category === activeCategory);

  const toggle = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <section id="faq" className="py-10 sm:py-16 bg-slate-50 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column (5 Cols): Sticky Header, Category Filters & Help Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <ScrollReveal animation="fade-up">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/90 text-blue-800 text-xs font-bold mb-3">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Knowledge Base & Support</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black font-display text-slate-900 tracking-[-0.03em] leading-tight">
                  Frequently Asked Questions
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Everything you need to know about AlignView 3D’s WebGL engine, clear aligner biomechanics, client-side privacy, and precision diagnostic tools.
                </p>
              </div>

              {/* Interactive Category Filter Tabs */}
              <div className="flex flex-wrap gap-2 my-5">
                {[
                  { id: 'all', label: 'All Topics' },
                  { id: 'biomechanics', label: 'Biomechanics' },
                  { id: 'security', label: 'Privacy & HIPAA' },
                  { id: 'compatibility', label: 'Compatibility' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as CategoryFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* "Need More Help?" Community Card */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Have a custom requirement?</h4>
                    <p className="text-[11px] text-slate-500">Contact the author or report an issue</p>
                  </div>
                </div>
                
                <a
                  href="https://github.com/Sonu-Thomas-001/AlignView-3D/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                >
                  <span>Open GitHub Issues</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column (7 Cols): Rich Animated Accordion List */}
          <div className="lg:col-span-7 space-y-3.5">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === faq.id;
              return (
                <ScrollReveal 
                  key={faq.id} 
                  animation="fade-up" 
                  delay={idx * 60}
                  duration={450}
                >
                  <div
                    className={`rounded-2xl sm:rounded-3xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'bg-white border-blue-500/80 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/10'
                        : 'bg-white/80 hover:bg-white border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    {/* Accordion Question Trigger */}
                    <button
                      onClick={() => toggle(faq.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 transition-colors ${
                          isOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {faq.icon}
                        </div>
                        <span className={`text-xs sm:text-sm font-bold tracking-tight transition-colors ${
                          isOpen ? 'text-blue-900' : 'text-slate-900'
                        }`}>
                          {faq.question}
                        </span>
                      </div>

                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen ? 'rotate-180 bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </button>

                    {/* Accordion Expanded Content */}
                    {isOpen && (
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5 animate-in fade-in duration-200 space-y-3">
                        <p>{faq.answer}</p>

                        {/* Highlight Checklist Tags */}
                        <div className="pt-1.5 flex flex-wrap gap-1.5">
                          {faq.highlights.map((h, i) => (
                            <div 
                              key={i} 
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[10px] font-semibold text-slate-700"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
