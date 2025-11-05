"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { HomeStructuredData } from "@/components/home-structured-data";
import { HomeHero } from "@/components/home-hero";
import { HomeWhyChooseUs } from "@/components/home-why-choose-us";

// Lazy load below-fold sections for better performance
const HomeServiceAreas = dynamic(() => import("@/components/home-service-areas").then(mod => ({ default: mod.HomeServiceAreas })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20 bg-gray-50"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div></div></div>,
  ssr: false
});

const HomeFlagshipServices = dynamic(() => import("@/components/home-flagship-services").then(mod => ({ default: mod.HomeFlagshipServices })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20 bg-gray-50"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div></div></div>,
  ssr: false
});

const HomeServiceOfferings = dynamic(() => import("@/components/home-service-offerings").then(mod => ({ default: mod.HomeServiceOfferings })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20 bg-gray-50"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid md:grid-cols-3 gap-6"><div className="animate-pulse bg-gray-200 h-80 rounded-lg"></div><div className="animate-pulse bg-gray-200 h-80 rounded-lg"></div><div className="animate-pulse bg-gray-200 h-80 rounded-lg"></div></div></div></div>,
  ssr: false
});

const HomeReviewsShowcase = dynamic(() => import("@/components/home-reviews-showcase").then(mod => ({ default: mod.HomeReviewsShowcase })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div></div></div>,
  ssr: false
});

const HomeFeaturedIn = dynamic(() => import("@/components/home-featured-in").then(mod => ({ default: mod.HomeFeaturedIn })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div></div></div>,
  ssr: false
});

const HomeFinalCTA = dynamic(() => import("@/components/home-final-cta").then(mod => ({ default: mod.HomeFinalCTA })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div></div></div>,
  ssr: false
});

const HomeTeam = dynamic(() => import("@/components/home-team").then(mod => ({ default: mod.HomeTeam })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded"></div><div className="animate-pulse bg-gray-200 h-4 w-96 mx-auto mb-8 rounded"></div><div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"><div className="animate-pulse bg-gray-200 h-64 rounded"></div><div className="animate-pulse bg-gray-200 h-64 rounded"></div><div className="animate-pulse bg-gray-200 h-64 rounded"></div></div></div></div></div>,
  ssr: false
});

const HomeBlog = dynamic(() => import("@/components/home-blog").then(mod => ({ default: mod.HomeBlog })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded"></div><div className="animate-pulse bg-gray-200 h-4 w-96 mx-auto mb-8 rounded"></div><div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"><div className="animate-pulse bg-gray-200 h-80 rounded"></div><div className="animate-pulse bg-gray-200 h-80 rounded"></div><div className="animate-pulse bg-gray-200 h-80 rounded"></div></div></div></div></div>,
  ssr: false
});

const HomeFAQ = dynamic(() => import("@/components/home-faq").then(mod => ({ default: mod.HomeFAQ })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20 bg-gray-50"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><div className="text-center mb-8"><div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded"></div></div><div className="space-y-4"><div className="animate-pulse bg-white h-20 rounded-lg"></div><div className="animate-pulse bg-white h-20 rounded-lg"></div></div></div></div>,
  ssr: false
});

const HomeFooter = dynamic(() => import("@/components/home-footer").then(mod => ({ default: mod.HomeFooter })), {
  loading: () => <div className="bg-gray-900 text-white py-12 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="animate-pulse bg-gray-800 h-32 rounded"></div></div></div>,
  ssr: false
});

export function HomeContent() {
  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <HomeStructuredData />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HomeHero />

      {/* Flagship Services Section */}
      <HomeFlagshipServices />

      {/* Why Choose Us Section */}
      <HomeWhyChooseUs />

      {/* Service Areas Section */}
      <HomeServiceAreas />

      {/* Service Offerings Section */}
      <HomeServiceOfferings />

      {/* Customer Reviews Section */}
      <HomeReviewsShowcase />

      {/* Team Section - Lazy Loaded */}
      <HomeTeam />

      {/* FAQ Section - Lazy Loaded */}
      <HomeFAQ />

      {/* As Featured In Section */}
      <HomeFeaturedIn />

      {/* Blog Section - Lazy Loaded */}
      <HomeBlog />

      {/* Final CTA Section */}
      <HomeFinalCTA />

      {/* Footer - Lazy Loaded */}
      <HomeFooter />
    </div>
  );
}
