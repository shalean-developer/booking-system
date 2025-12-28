import { ServicePageTemplate } from "@/components/service-page-template";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "One-Time Cleaning Services Cape Town | Single Clean Service",
  description:
    "Professional one-time cleaning in Cape Town. Single cleaning service for homes & offices. Trusted cleaners near you. Flexible booking. Book today.",
  canonical: generateCanonical("/services/one-time-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-one-time-cleaning-1200x630.jpg",
    alt: "Professional one-time cleaning service in Cape Town - Shalean Cleaning Services",
  },
});

const features = [
  "Comprehensive one-time deep clean",
  "All standard cleaning tasks included",
  "Flexible scheduling to suit your needs",
  "Perfect for special occasions",
  "Move-in or move-out preparation",
  "Post-event cleanup",
  "Seasonal deep cleaning",
  "Custom cleaning checklist available",
];

const highlights = [
  "Perfect for special occasions and events",
  "No long-term commitment required",
  "Flexible booking around your schedule",
  "Same-day service available",
  "Professional results in a single visit",
];

const faqs = [
  {
    question: "When would I need one-time cleaning?",
    answer: "One-time cleaning is perfect for special occasions, before hosting events, after parties, seasonal deep cleaning, preparing for guests, or when you need extra help without committing to regular service. It's also ideal for move-in or move-out preparation."
  },
  {
    question: "What's included in one-time cleaning?",
    answer: "Our one-time cleaning includes all standard cleaning tasks: comprehensive dusting, vacuuming, mopping, kitchen and bathroom deep cleaning, surface sanitization, and trash removal. We can customize the service based on your specific needs."
  },
  {
    question: "Can I book same-day service?",
    answer: "Yes, we offer same-day service subject to availability. We recommend booking at least 24 hours in advance to ensure availability, but we'll do our best to accommodate same-day requests when possible."
  },
  {
    question: "How is one-time cleaning different from regular cleaning?",
    answer: "One-time cleaning is typically more thorough than regular maintenance cleaning, as we're doing a comprehensive clean of your entire space in one visit. Regular cleaning focuses on maintenance, while one-time cleaning is a complete refresh."
  },
  {
    question: "Can I convert to regular cleaning later?",
    answer: "Absolutely! Many customers start with one-time cleaning and then convert to weekly, bi-weekly, or monthly regular service. We'll work with you to find the perfect schedule for your needs."
  }
];

const relatedServices = [
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Thorough deep cleaning service"
  },
  {
    title: "House Cleaning",
    href: "/services/house-cleaning",
    description: "Regular house cleaning service"
  },
  {
    title: "After-Party Cleaning",
    href: "/services/after-party-cleaning",
    description: "Post-event cleanup service"
  }
];

export default function OneTimeCleaningServicePage() {
  return (
    <ServicePageTemplate
      title="Professional One-Time Cleaning Services in Cape Town"
      description="Need a single deep clean? Shalean Cleaning Services offers professional one-time cleaning in Cape Town. Our trusted team provides comprehensive cleaning for homes and offices. Perfect for special occasions, spring cleaning, or when you need extra help."
      icon={Calendar}
      features={features}
      pricing="From R250"
      pricingNote="Quoted based on property size and cleaning requirements"
      highlights={highlights}
      serviceType="One-Time Cleaning"
      slug="one-time-cleaning"
      color="bg-green-50"
      iconColor="text-green-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}










































