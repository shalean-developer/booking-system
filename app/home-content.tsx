import { Header } from "@/components/header";
import { HomeStructuredData } from "@/components/home-structured-data";
import { HomeHero } from "@/components/home-hero";
import { HomeReviewsApp } from "@/components/home-reviews-app";
import { HomePopularServices } from "@/components/home-popular-projects";
import { HomePricing } from "@/components/home-pricing";
import { HomeEverydayLife } from "@/components/home-everyday-life";
import { HomeFeaturedCleaners } from "@/components/home-featured-taskers";
import { HomeGoToTeam } from "@/components/home-go-to-team";
import { HomeGuides } from "@/components/home-guides";
import { HomeReviewsShowcase } from "@/components/home-reviews-showcase";
import { HomeCities } from "@/components/home-cities";
import { HomeFAQ } from "@/components/home-faq";
import { HomeReadyToStart } from "@/components/home-ready-to-start";
import { HomeFooterClient } from "@/components/home-footer-client";

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

        {/* Popular Services Section */}
        <section aria-label="Our cleaning services">
          <HomePopularServices />
        </section>

        {/* Pricing Section */}
        <section aria-label="Cleaning services pricing">
          <HomePricing />
        </section>

        {/* Everyday Life Made Easier Section */}
        <section aria-label="Benefits of our cleaning services">
          <HomeEverydayLife />
        </section>

        {/* Featured Cleaners Section */}
        <section aria-label="Our expert cleaning team">
          <HomeFeaturedCleaners />
        </section>

        {/* A Go-To Team Section */}
        <section aria-label="Why choose our cleaning team">
          <HomeGoToTeam />
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
