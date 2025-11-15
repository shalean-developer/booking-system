import { ServicePageTemplate } from "@/components/service-page-template";
import { Users, Clock, Shield, Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Apartment Cleaning Services Cape Town | Flat Cleaning | Shalean",
  description: "Specialized apartment cleaning services in Cape Town. Professional cleaners experienced with apartment layouts and strata requirements. Compact space optimization, balcony cleaning. From R200. Book today!",
  canonical: generateCanonical("/services/apartment-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-apartment-cleaning-1200x630.jpg",
    alt: "Professional apartment cleaning services in Cape Town - Shalean Cleaning Services"
  }
});

export default function ApartmentCleaningPage() {
  return (
    <ServicePageTemplate
      title="Apartment Cleaning Services in Cape Town"
      description="Specialized cleaning services for apartments and condos in Cape Town. Our cleaners understand apartment layouts and strata requirements. Serving Sea Point, City Bowl, Green Point, and all Cape Town apartment areas."
      icon={Users}
      features={[
        "Compact space optimization",
        "Strata-compliant cleaning",
        "Balcony and outdoor area cleaning",
        "Built-in storage cleaning",
        "Compact kitchen deep cleaning",
        "Small bathroom sanitization",
        "Floor maintenance",
        "Window and door cleaning"
      ]}
      pricing="From R200"
      pricingNote="Pricing based on apartment size and specific requirements"
      highlights={[
        "Strata-compliant service for Cape Town apartments",
        "Compact space specialists",
        "Flexible scheduling across Cape Town",
        "Building access coordination",
        "Serving all Cape Town apartment buildings"
      ]}
      serviceType="Apartment Cleaning"
      slug="apartment-cleaning"
      color="bg-purple-50"
      iconColor="text-purple-600"
    />
  );
}
