import { ServicePageTemplate } from "@/components/service-page-template";
import { Sparkles, Clock, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Window Cleaning Services Cape Town | Professional Window Cleaners | Shalean",
  description: "Professional window cleaning services in Cape Town for homes and offices. Crystal clear windows with streak-free results. Interior and exterior cleaning. From R150. Book trusted cleaners today!",
  canonical: generateCanonical("/services/window-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-window-cleaning-1200x630.jpg",
    alt: "Professional window cleaning services in Cape Town - Shalean Cleaning Services"
  }
});

export default function WindowCleaningPage() {
  return (
    <ServicePageTemplate
      title="Window Cleaning Services in Cape Town"
      description="Professional window cleaning for crystal clear results in Cape Town. Our specialized window cleaners deliver streak-free, spotless windows. Serving homes and offices across Sea Point, Camps Bay, Constantia, and all Cape Town areas."
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
        "Streak-free guarantee for all Cape Town properties",
        "Safety-first approach",
        "Eco-friendly solutions",
        "Regular maintenance programs across Cape Town",
        "Serving all Cape Town suburbs"
      ]}
      serviceType="Window Cleaning"
      slug="window-cleaning"
      color="bg-cyan-50"
      iconColor="text-cyan-600"
    />
  );
}
