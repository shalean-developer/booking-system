import { ServicePageTemplate } from "@/components/service-page-template";
import { Sparkles, Clock, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Window Cleaning Services | Shalean",
  description: "Professional window cleaning services for homes and offices. Crystal clear windows with streak-free results. Book your window cleaner today!",
  canonical: generateCanonical("/services/window-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-window-cleaning-1200x630.jpg",
    alt: "Professional window cleaning services"
  }
});

export default function WindowCleaningPage() {
  return (
    <ServicePageTemplate
      title="Window Cleaning Services"
      description="Professional window cleaning for crystal clear results. Our specialized window cleaners deliver streak-free, spotless windows every time."
      icon={Sparkles}
      features={[
        "Interior and exterior window cleaning",
        "Window frame and sill cleaning",
        "Screen cleaning and maintenance",
        "Streak-free results guaranteed",
        "Safety equipment for high windows",
        "Eco-friendly cleaning solutions",
        "Regular maintenance programs",
        "Emergency window cleaning"
      ]}
      pricing="From R150"
      pricingNote="Pricing based on number of windows and accessibility"
      highlights={[
        "Streak-free guarantee",
        "Safety-first approach",
        "Eco-friendly solutions",
        "Regular maintenance programs"
      ]}
      serviceType="Window Cleaning"
      slug="window-cleaning"
      color="bg-cyan-50"
      iconColor="text-cyan-600"
    />
  );
}
