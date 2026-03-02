"use client";

import { ShaleanHeader } from "@/components/shalean-header";
import { ShaleanFooter } from "@/components/shalean-footer";
import { ShaleanFab } from "@/components/shalean-fab";
import { ShaleanMobileCta } from "@/components/shalean-mobile-cta";
import {
  Hero,
  CoreServices,
  WhatsIncluded,
  WhyChoose,
  PricingTransparency,
  TrustStats,
  HowItWorks,
  BeforeAfter,
  Testimonials,
  BlogPreview,
  LocalSeo,
  FAQ,
  SatisfactionGuarantee,
  CtaFinal,
} from "@/components/home-v2";

export function HomeContent() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white">
      <ShaleanHeader />

      <main id="main-content" className="flex-grow pt-16 pb-24">
        <Hero />
        <CoreServices />
        <WhatsIncluded />
        <WhyChoose />
        <PricingTransparency />
        <TrustStats />
        <HowItWorks />
        <BeforeAfter />
        <Testimonials />
        <BlogPreview />
        <LocalSeo />
        <FAQ />
        <SatisfactionGuarantee />
        <CtaFinal />
      </main>

      <ShaleanFooter />
      <ShaleanFab />
      <ShaleanMobileCta />
    </div>
  );
}
