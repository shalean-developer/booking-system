import { Header } from "@/components/header";
import { HomeStructuredData } from "@/components/home-structured-data";
import { HomeHero } from "@/components/home-hero";
import { HomeReviewsApp } from "@/components/home-reviews-app";
import { HomePopularServices } from "@/components/home-popular-projects";
import { HomeCategories } from "@/components/home-categories";
import { HomeFeaturedServices } from "@/components/home-featured-services";
import { HomeWorkingProcess } from "@/components/home-working-process";
import { HomeFeaturedCleaners } from "@/components/home-featured-taskers";
import { HomeGuides } from "@/components/home-guides";
import { HomeReviewsShowcase } from "@/components/home-reviews-showcase";
import { HomeCities } from "@/components/home-cities";
import { HomeFAQ } from "@/components/home-faq";
import { HomeReadyToStart } from "@/components/home-ready-to-start";
import { HomeFooterClient } from "@/components/home-footer-client";
import Image from "next/image";

export function HomeContent() {
  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <HomeStructuredData />

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
            <div className="relative w-full max-w-4xl mx-auto h-[350px] md:h-[400px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/images/office-cleaning-team.jpg"
                alt="Professional cleaning team disinfecting and cleaning office environment - Shalean Cleaning Services"
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
