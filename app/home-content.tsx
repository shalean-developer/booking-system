"use client";

import dynamic from "next/dynamic";
import { ShaleanHeader } from "@/components/shalean-header";
import { ShaleanFooter } from "@/components/shalean-footer";
import { ShaleanFab } from "@/components/shalean-fab";
import { ShaleanMobileCta } from "@/components/shalean-mobile-cta";
import { Hero, CoreServices } from "@/components/home-v2";

const SectionPlaceholder = ({ minHeight = 240 }: { minHeight?: number }) => (
  <div
    className="w-full animate-pulse bg-slate-50/70"
    style={{ minHeight }}
    aria-hidden
  />
);

const AboutProfessional = dynamic(
  () =>
    import("@/components/home-v2/about-professional").then(
      (mod) => mod.AboutProfessional
    ),
  { loading: () => <SectionPlaceholder minHeight={420} /> }
);

const Testimonials = dynamic(
  () => import("@/components/home-v2/testimonials").then((mod) => mod.Testimonials),
  { loading: () => <SectionPlaceholder minHeight={520} /> }
);

const MoreThanClean = dynamic(
  () => import("@/components/home-v2/more-than-clean").then((mod) => mod.MoreThanClean),
  { loading: () => <SectionPlaceholder minHeight={380} /> }
);

const BlogPreview = dynamic(
  () => import("@/components/home-v2/blog-preview").then((mod) => mod.BlogPreview),
  { loading: () => <SectionPlaceholder minHeight={380} /> }
);

const BusinessScale = dynamic(
  () => import("@/components/home-v2/business-scale").then((mod) => mod.BusinessScale),
  { loading: () => <SectionPlaceholder minHeight={380} /> }
);

const FAQ = dynamic(
  () => import("@/components/home-v2/faq").then((mod) => mod.FAQ),
  { loading: () => <SectionPlaceholder minHeight={340} /> }
);

const HowItWorks = dynamic(
  () => import("@/components/home-v2/how-it-works").then((mod) => mod.HowItWorks),
  { loading: () => <SectionPlaceholder minHeight={320} /> }
);

export function HomeContent() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white">
      <ShaleanHeader />

      <main id="main-content" className="flex-grow pt-14 md:pt-16 pb-24">
        <Hero />
        <CoreServices />
        <AboutProfessional />
        <Testimonials />
        <MoreThanClean />
        <BlogPreview />
        <BusinessScale />
        <FAQ />
        <HowItWorks />
      </main>

      <ShaleanFooter />
      <ShaleanFab />
      <ShaleanMobileCta />
    </div>
  );
}
