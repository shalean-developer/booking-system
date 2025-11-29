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

const faqs = [
  {
    question: "What's included in apartment cleaning services in Cape Town?",
    answer: "Our apartment cleaning includes compact space optimization, strata-compliant cleaning, balcony and outdoor area cleaning, built-in storage cleaning, compact kitchen deep cleaning, small bathroom sanitization, floor maintenance, and window and door cleaning. We specialize in efficiently cleaning compact spaces."
  },
  {
    question: "Do you handle building access and strata requirements?",
    answer: "Yes, we coordinate building access and ensure all cleaning practices comply with strata requirements. Our Cape Town cleaners are experienced with apartment building protocols and can work with building management as needed."
  },
  {
    question: "How long does apartment cleaning take?",
    answer: "Apartment cleaning typically takes 2-4 hours depending on apartment size and cleaning type. A studio or 1-bedroom may take 2-3 hours, while larger 2-3 bedroom apartments can take 3-4 hours. We'll provide an estimated time when you book."
  },
  {
    question: "Can you clean balconies and outdoor areas?",
    answer: "Yes, we include balcony and outdoor area cleaning as part of our apartment cleaning service. This includes sweeping, wiping down surfaces, and ensuring outdoor spaces are clean and presentable."
  },
  {
    question: "Do you offer recurring apartment cleaning?",
    answer: "Absolutely! We offer weekly, bi-weekly, or monthly recurring cleaning for apartments across Cape Town. Recurring customers get consistent cleaners whenever possible, priority scheduling, and discounts on regular visits."
  }
];

const relatedServices = [
  {
    title: "Regular Cleaning",
    href: "/services/regular-cleaning",
    description: "Maintain your apartment with weekly or bi-weekly regular cleaning services"
  },
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Comprehensive deep cleaning for thorough apartment reset"
  },
  {
    title: "Move-In/Out Cleaning",
    href: "/services/move-turnover",
    description: "Professional cleaning for moving in or out of your apartment"
  }
];

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
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}
