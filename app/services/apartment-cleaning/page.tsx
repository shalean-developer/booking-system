import { ServicePageTemplate } from "@/components/service-page-template";
import { Users, Clock, Shield, Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Apartment Cleaning Services | Shalean Specialized Apartment Cleaning Services — Professional Cleaners Experienced with Apartment Layouts and Strata Requirements Offering Compact Space Optimization, Balcony Cleaning, and Building Access Coordination",
  description: "Specialized apartment cleaning services. Professional cleaners experienced with apartment layouts and strata requirements. Book today! Compact space optimization, balcony cleaning, built-in storage cleaning, and flexible scheduling available.",
  canonical: generateCanonical("/services/apartment-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-apartment-cleaning-1200x630.jpg",
    alt: "Professional apartment cleaning services"
  }
});

export default function ApartmentCleaningPage() {
  return (
    <ServicePageTemplate
      title="Apartment Cleaning Services"
      description="Specialized cleaning services for apartments and condos. Our cleaners understand apartment layouts and strata requirements for optimal results."
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
        "Strata-compliant service",
        "Compact space specialists",
        "Flexible scheduling",
        "Building access coordination"
      ]}
      serviceType="Apartment Cleaning"
      slug="apartment-cleaning"
      color="bg-purple-50"
      iconColor="text-purple-600"
    />
  );
}
