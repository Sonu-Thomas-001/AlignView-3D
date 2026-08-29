'use client';

import React from 'react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { ShieldCheck, FileText, Lock, AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/90 text-blue-800 text-xs font-bold mb-4">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Legal & Intellectual Property</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service & Proprietary License
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Last Updated: August 29, 2026. Please read these terms carefully before accessing or using AlignView 3D.
            </p>
          </div>

          {/* Terms Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200/90 shadow-sm space-y-10 text-xs sm:text-sm text-slate-700 leading-relaxed">
            
            {/* Section 1: Ownership */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">1</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Proprietary Ownership & Intellectual Property</h2>
              </div>
              <p>
                AlignView 3D, including its source code, 3D dental mathematical algorithms, geometry generation engines, shader pipelines, user interfaces, branding, and visual assets (collectively, the &quot;Software&quot;), is a proprietary product of <strong>MidCell Studios</strong>, authored and engineered by <strong>Sonu Thomas</strong> (&quot;Owner&quot;). All rights, title, and interest are strictly reserved.
              </p>
            </section>

            {/* Section 2: Strict Prohibition of Code Usage */}
            <section className="space-y-4 p-6 rounded-2xl bg-red-50/70 border border-red-200/80 text-red-950">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-red-900">Strict Code Use Restrictions & Prohibition of Cloning</h2>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-red-900/90">
                You are expressly and strictly prohibited from:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm list-disc pl-5 text-red-900/90">
                <li>Copying, duplicating, cloning, or reproducing the source code in whole or in part.</li>
                <li>Distributing, publishing, sublicensing, leasing, renting, or selling the Software.</li>
                <li>Reverse engineering, decompiling, extracting, or disassembling the proprietary 3D geometry systems or shader pipelines.</li>
                <li>Creating derivative works, commercial forks, or competing orthodontic/dental viewer products.</li>
                <li>Hosting unauthorized mirrors or public deployments of this application without written authorization.</li>
              </ul>
            </section>

            {/* Section 3: Permitted Use */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">2</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Permitted Clinical & Diagnostic Use</h2>
              </div>
              <p>
                Users are granted a limited, revocable, non-exclusive license to use the AlignView 3D web application interface solely for clinical inspection, clear aligner visualization, educational analysis, and treatment planning verification.
              </p>
            </section>

            {/* Section 4: Clinical Disclaimer */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">3</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Clinical Responsibility & Medical Disclaimer</h2>
              </div>
              <p>
                AlignView 3D is a software modeling and visualization tool. It does not constitute medical or orthodontic advice, diagnosis, or prescription. Dental professionals remain solely responsible for validating patient anatomy, treatment plans, and biomechanical staging before fabrication or appliance delivery.
              </p>
            </section>

            {/* Section 5: Limitation of Liability */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">4</div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Limitation of Liability & Warranty Disclaimer</h2>
              </div>
              <p>
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. UNDER NO CIRCUMSTANCES SHALL SONU THOMAS OR ALIGNVIEW 3D BE LIABLE FOR DIRECT, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THIS APPLICATION.
              </p>
            </section>

            {/* Section 6: Contact */}
            <section className="pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                For commercial licensing inquiries, enterprise integrations, or legal questions, please contact the author via the official repository.
              </p>
            </section>

          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
