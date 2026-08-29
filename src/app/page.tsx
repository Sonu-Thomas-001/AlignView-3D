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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white scroll-smooth">
      {/* 1. Sticky Glassmorphic Navbar */}
      <LandingNavbar />

      {/* 2. Hero Section with Animated Mock Studio Interface & Badges */}
      <HeroSection />

      {/* 3. Performance & Speed Metrics Ribbon */}
      <MetricsSection />

      {/* 4. Bento Grid Innovation Feature Suite */}
      <BentoGridSection />

      {/* 5. 4-Step Clinical & Lab Workflow Tabs */}
      <WorkflowSection />

      {/* 6. Interactive Before / After Smile Alignment Slider */}
      <BeforeAfterSection />

      {/* 7. Comparison Table: AlignView 3D vs. Legacy CAD */}
      <ComparisonSection />

      {/* 8. Frequently Asked Questions Accordion */}
      <FaqSection />

      {/* 9. High-Impact Call to Action Banner */}
      <CtaSection />

      {/* 10. Footer */}
      <LandingFooter />
    </div>
  );
}
