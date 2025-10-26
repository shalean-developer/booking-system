"use client";

import { Header } from "@/components/header";
import { HomeStructuredData } from "@/components/home-structured-data";
import { HomeHero } from "@/components/home-hero";
import { HomeFlagshipServices } from "@/components/home-flagship-services";
import { HomeWhyChooseUs } from "@/components/home-why-choose-us";
import { HomeServiceAreas } from "@/components/home-service-areas";
import { HomeServiceOfferings } from "@/components/home-service-offerings";
import { HomeReviewsShowcase } from "@/components/home-reviews-showcase";
import { HomeFeaturedIn } from "@/components/home-featured-in";
import { HomeFinalCTA } from "@/components/home-final-cta";
import dynamic from "next/dynamic";

// Lazy load below-fold sections
const HomeTeam = dynamic(() => import("@/components/home-team").then(mod => ({ default: mod.HomeTeam })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded"></div><div className="animate-pulse bg-gray-200 h-4 w-96 mx-auto mb-8 rounded"></div><div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"><div className="animate-pulse bg-gray-200 h-64 rounded"></div><div className="animate-pulse bg-gray-200 h-64 rounded"></div><div className="animate-pulse bg-gray-200 h-64 rounded"></div></div></div></div></div>
});

const HomeBlog = dynamic(() => import("@/components/home-blog").then(mod => ({ default: mod.HomeBlog })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded"></div><div className="animate-pulse bg-gray-200 h-4 w-96 mx-auto mb-8 rounded"></div><div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"><div className="animate-pulse bg-gray-200 h-80 rounded"></div><div className="animate-pulse bg-gray-200 h-80 rounded"></div><div className="animate-pulse bg-gray-200 h-80 rounded"></div></div></div></div></div>
});

const HomeFAQ = dynamic(() => import("@/components/home-faq").then(mod => ({ default: mod.HomeFAQ })), {
  loading: () => <div className="py-12 sm:py-16 lg:py-20 bg-gray-50"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><div className="text-center mb-8"><div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded"></div></div><div className="space-y-4"><div className="animate-pulse bg-white h-20 rounded-lg"></div><div className="animate-pulse bg-white h-20 rounded-lg"></div></div></div></div>
});

const HomeFooter = dynamic(() => import("@/components/home-footer").then(mod => ({ default: mod.HomeFooter })), {
  loading: () => <div className="bg-gray-900 text-white py-12 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="animate-pulse bg-gray-800 h-32 rounded"></div></div></div>
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

