'use client';

import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MetricsSection } from '@/components/landing/MetricsSection';
import { BentoGridSection } from '@/components/landing/BentoGridSection';
import { WorkflowSection } from '@/components/landing/WorkflowSection';
import { BeforeAfterSection } from '@/components/landing/BeforeAfterSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
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
        {/* Hero Section with Animated Mock Studio Interface & Badges */}
        <HeroSection />

        {/* Performance & Speed Metrics Ribbon */}
        <MetricsSection />

        {/* Bento Grid Innovation Feature Suite */}
        <BentoGridSection />

        {/* 4-Step Clinical & Lab Workflow Tabs */}
        <WorkflowSection />

        {/* Interactive Before / After Smile Alignment Slider */}
        <BeforeAfterSection />

        {/* Comparison Table: AlignView 3D vs. Legacy CAD */}
        <ComparisonSection />

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
