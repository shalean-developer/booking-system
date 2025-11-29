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

const faqs = [
  {
    question: "What's included in window cleaning services in Cape Town?",
    answer: "Our window cleaning includes interior and exterior window cleaning, window frame and sill cleaning, screen cleaning and maintenance, streak-free results guaranteed, safety equipment for high windows, eco-friendly cleaning solutions, regular maintenance programs, and emergency window cleaning services."
  },
  {
    question: "Do you clean both interior and exterior windows?",
    answer: "Yes, we clean both interior and exterior windows. Our Cape Town window cleaners use professional equipment and techniques to ensure streak-free, crystal-clear results on both sides of your windows."
  },
  {
    question: "Can you clean high or hard-to-reach windows?",
    answer: "Yes, we have safety equipment and training to clean high windows safely. Our team uses appropriate ladders, safety harnesses, and professional tools to reach windows on upper floors while maintaining safety standards."
  },
  {
    question: "How often should I schedule window cleaning?",
    answer: "Most Cape Town properties benefit from monthly or quarterly window cleaning. However, frequency depends on your location, weather conditions, and preferences. We offer regular maintenance programs to keep your windows consistently clean."
  },
  {
    question: "Do you offer emergency window cleaning?",
    answer: "Yes, we offer emergency window cleaning services for urgent situations like pre-event cleaning, property viewings, or special occasions. Contact us as soon as possible for the best chance of same-day service."
  }
];

const relatedServices = [
  {
    title: "Regular Cleaning",
    href: "/services/regular-cleaning",
    description: "Complete home cleaning including window maintenance"
  },
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Comprehensive deep cleaning with detailed window care"
  },
  {
    title: "Home Maintenance",
    href: "/services/home-maintenance",
    description: "Ongoing maintenance including regular window cleaning"
  }
];

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
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}
