import { Header } from "@/components/header";
import { HomeStructuredData } from "@/components/home-structured-data";
import { HomeHero } from "@/components/home-hero";
import { HomeWhyChooseUs } from "@/components/home-why-choose-us";
import {
  LazyHomeServiceAreas,
  LazyHomeFlagshipServices,
  LazyHomeServiceOfferings,
  LazyHomeReviewsShowcase,
  LazyHomeFeaturedIn,
  LazyHomeFinalCTA,
  LazyHomeTeam,
  LazyHomeBlog,
  LazyHomeFAQ,
  LazyHomeFooter,
} from "@/components/lazy-home-sections";

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
      <LazyHomeFlagshipServices />

      {/* Why Choose Us Section */}
      <HomeWhyChooseUs />

      {/* Service Areas Section */}
      <LazyHomeServiceAreas />

      {/* Service Offerings Section */}
      <LazyHomeServiceOfferings />

      {/* Customer Reviews Section */}
      <LazyHomeReviewsShowcase />

      {/* Team Section - Lazy Loaded */}
      <LazyHomeTeam />

      {/* FAQ Section - Lazy Loaded */}
      <LazyHomeFAQ />

      {/* As Featured In Section */}
      <LazyHomeFeaturedIn />

      {/* Blog Section - Lazy Loaded */}
      <LazyHomeBlog />

      {/* Final CTA Section */}
      <LazyHomeFinalCTA />

      {/* Footer - Lazy Loaded */}
      <LazyHomeFooter />
    </div>
  );
}
