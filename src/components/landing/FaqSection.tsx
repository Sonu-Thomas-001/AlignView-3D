'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What 3D file formats does AlignView 3D support?',
    answer: 'AlignView 3D natively supports standard binary and ASCII STL (.stl) files. When you drop files into the viewer, the engine automatically calculates normal vectors, surface topology, vertex density, and bounding box dimensions in millimeters.',
  },
  {
    question: 'Is patient data or 3D scan geometry uploaded to any remote server?',
    answer: 'No. AlignView 3D processes all mesh geometry 100% locally in your web browser using client-side Web Workers and WebGL buffers. No patient data, scan files, or telemetry ever leaves your device, ensuring complete HIPAA and GDPR compliance.',
  },
  {
    question: 'How does the 32-stage clear aligner treatment morphing work?',
    answer: 'The orthodontic engine applies parametric biomechanical trajectory equations to each tooth crown in the arch. As you scrub through stages 1 to 32, individual teeth smoothly undergo rotational torque, tipping corrections, and parabolic arch expansion at 60 frames per second.',
  },
  {
    question: 'Can I capture high-resolution screenshots for patient consultations?',
    answer: 'Yes. The built-in screenshot and export tool captures pixel-perfect high-resolution PNG snapshots directly from the WebGL frame buffer, complete with studio lighting, shadows, and reflection details.',
  },
  {
    question: 'Does AlignView 3D work on iPads, tablets, and mobile smartphones?',
    answer: 'Yes! The user interface is fully responsive. On tablets and mobile screens, sidebars tuck into smooth slide-over drawers, and all 3D orbit, zoom, pan, and stage scrubbing controls support native multi-touch gestures.',
  },
  {
    question: 'Is AlignView 3D free and open-source?',
    answer: 'Yes. AlignView 3D is 100% free and open-source under the MIT license. You can clone the repository, inspect the codebase, or contribute on GitHub.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 sm:py-32 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="px-3.5 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
            Got Questions? We’ve Got Answers.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Everything you need to know about the AlignView 3D dental inspection engine.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
