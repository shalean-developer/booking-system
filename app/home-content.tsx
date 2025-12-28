'use client';

import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { HomeHero } from "@/components/home-hero";
import { HomeReviewsApp } from "@/components/home-reviews-app";
import Image from "next/image";

// Dynamic imports for below-the-fold components to improve initial load time
const HomePopularServices = dynamic(
  () => import("@/components/home-popular-projects").then((mod) => ({ default: mod.HomePopularServices })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeCategories = dynamic(
  () => import("@/components/home-categories").then((mod) => ({ default: mod.HomeCategories })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeFeaturedServices = dynamic(
  () => import("@/components/home-featured-services").then((mod) => ({ default: mod.HomeFeaturedServices })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeWorkingProcess = dynamic(
  () => import("@/components/home-working-process").then((mod) => ({ default: mod.HomeWorkingProcess })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-80 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeFeaturedCleaners = dynamic(
  () => import("@/components/home-featured-taskers").then((mod) => ({ default: mod.HomeFeaturedCleaners })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeGuides = dynamic(
  () => import("@/components/home-guides").then((mod) => ({ default: mod.HomeGuides })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeReviewsShowcase = dynamic(
  () => import("@/components/home-reviews-showcase").then((mod) => ({ default: mod.HomeReviewsShowcase })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeCities = dynamic(
  () => import("@/components/home-cities").then((mod) => ({ default: mod.HomeCities })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeFAQ = dynamic(
  () => import("@/components/home-faq").then((mod) => ({ default: mod.HomeFAQ })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeReadyToStart = dynamic(
  () => import("@/components/home-ready-to-start").then((mod) => ({ default: mod.HomeReadyToStart })),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
        </div>
      </section>
    )
  }
);

const HomeFooterClient = dynamic(
  () => import("@/components/home-footer-client").then((mod) => ({ default: mod.HomeFooterClient })),
  { 
    ssr: false,
    loading: () => (
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-gray-800 h-32 rounded-lg" />
        </div>
      </footer>
    )
  }
);

export function HomeContent() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <Header />

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section aria-label="Hero section">
          <HomeHero />
        </section>

        {/* Reviews & App Download Section */}
        <section aria-label="Customer reviews and app download">
          <HomeReviewsApp />
        </section>

        {/* Office Cleaning Team Image Section */}
        <section aria-label="Professional cleaning team" className="pt-0 pb-0 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="relative w-full max-w-4xl mx-auto h-[350px] md:h-[400px] rounded-lg overflow-hidden shadow-lg" style={{ position: 'relative' }}>
              <Image
                src="/images/office-cleaning-team.jpg"
                alt="Professional office cleaning team disinfecting and cleaning office environment in Cape Town - Shalean Cleaning Services"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
                priority={false}
              />
            </div>
          </div>
        </section>

        {/* Popular Services Section */}
        <section aria-label="Our cleaning services">
          <HomePopularServices />
        </section>

        {/* Our Category Section */}
        <section aria-label="Service categories">
          <HomeCategories />
        </section>

        {/* Featured Services Section */}
        <section aria-label="Featured services">
          <HomeFeaturedServices />
        </section>

        {/* Our Working Process Section */}
        <section aria-label="Our working process">
          <HomeWorkingProcess />
        </section>

        {/* Featured Cleaners Section */}
        <section aria-label="Our expert cleaning team">
          <HomeFeaturedCleaners />
        </section>

        {/* Guides Section */}
        <section aria-label="Cleaning tips and guides">
          <HomeGuides />
        </section>

        {/* Testimonials Section */}
        <section aria-label="Customer testimonials">
          <HomeReviewsShowcase />
        </section>

        {/* Cities Where We Work Section */}
        <section aria-label="Service areas and locations">
          <HomeCities />
        </section>

        {/* FAQ Section */}
        <section aria-label="Frequently asked questions">
          <HomeFAQ />
        </section>

        {/* Ready To Get Started Section */}
        <section aria-label="Call to action">
          <HomeReadyToStart />
        </section>
      </main>

      {/* Footer */}
      <HomeFooterClient />
    </div>
  );
}
