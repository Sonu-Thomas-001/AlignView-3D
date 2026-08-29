'use client';

import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MetricsSection } from '@/components/landing/MetricsSection';
import { BentoGridSection } from '@/components/landing/BentoGridSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white scroll-smooth flex flex-col">
      {/* 1. Semantic Sticky Header & Navbar */}
      <LandingNavbar />

      {/* 2. Semantic Main Body */}
      <main className="flex-1">
        {/* Hero Section with Release Badges & Value Proposition */}
        <HeroSection />

        {/* Performance & Speed Metrics Telemetry Card */}
        <MetricsSection />

        {/* Bento Grid Innovation Feature Suite */}
        <BentoGridSection />

        {/* Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* High-Impact Call to Action Banner */}
        <CtaSection />
      </main>

      {/* 3. Semantic Footer */}
      <LandingFooter />
    </div>
  );
}
