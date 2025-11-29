import { ServicePageTemplate } from "@/components/service-page-template";
import { Home, Calendar, Clock, Shield } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Home Maintenance Cleaning Cape Town | Regular Upkeep | Shalean",
  description: "Professional home maintenance cleaning services in Cape Town. Regular upkeep for ongoing cleanliness. Flexible scheduling, one-off or recurring visits. From R250. Book trusted cleaners today!",
  canonical: generateCanonical("/services/home-maintenance"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-home-maintenance-1200x630.jpg",
    alt: "Professional home maintenance cleaning services in Cape Town - Shalean Cleaning Services"
  }
});

const faqs = [
  {
    question: "What's included in home maintenance cleaning in Cape Town?",
    answer: "Home maintenance cleaning includes routine cleaning to maintain your home's cleanliness and organization, flexible scheduling for one-off or recurring visits, customizable service to focus on areas that matter most, dusting and vacuuming, kitchen and bathroom maintenance, floor care, and trash removal."
  },
  {
    question: "Can I schedule one-off or recurring maintenance cleaning?",
    answer: "Yes! We offer both one-off visits and recurring maintenance cleaning. You can schedule weekly, bi-weekly, or monthly visits. Recurring customers get consistent cleaners whenever possible, priority scheduling, and discounts on regular visits."
  },
  {
    question: "How is home maintenance different from regular cleaning?",
    answer: "Home maintenance cleaning focuses on ongoing upkeep and maintaining a baseline level of cleanliness. It's perfect for busy households who want consistent support without the intensity of deep cleaning. Regular cleaning is similar but may be scheduled more frequently."
  },
  {
    question: "Can I customize what gets cleaned during maintenance visits?",
    answer: "Absolutely! We tailor the service to focus on the areas that matter most to you. You can prioritize specific rooms, request special attention to certain tasks, or adjust the cleaning checklist based on your preferences and lifestyle."
  },
  {
    question: "How much does home maintenance cleaning cost in Cape Town?",
    answer: "Home maintenance cleaning starts from R250, depending on property size and frequency. Recurring customers receive discounts on regular visits. Contact us for a custom quote based on your specific needs and schedule."
  }
];

const relatedServices = [
  {
    title: "Regular Cleaning",
    href: "/services/regular-cleaning",
    description: "Weekly or bi-weekly regular cleaning for consistent maintenance"
  },
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Comprehensive deep cleaning for thorough home reset"
  },
  {
    title: "Home Maintenance",
    href: "/services/home-maintenance",
    description: "Ongoing maintenance cleaning to keep your home spotless"
  }
];

export default function HomeMaintenancePage() {
  return (
    <ServicePageTemplate
      title="Home Maintenance Cleaning in Cape Town"
      description="Regular home maintenance cleaning services in Cape Town for ongoing upkeep. Ideal for one-off or recurring visits. Flexible scheduling to fit your lifestyle. Serving Sea Point, Claremont, Constantia, and all Cape Town suburbs."
      icon={Home}
      features={[
        "Routine cleaning and organization",
        "Flexible scheduling options",
        "Customizable service focus",
        "Dusting and vacuuming",
        "Kitchen and bathroom maintenance",
        "Floor care and mopping",
        "Trash removal",
        "Surface sanitization"
      ]}
      pricing="From R250"
      pricingNote="Pricing varies based on property size and frequency"
      highlights={[
        "Flexible scheduling across Cape Town",
        "One-off or recurring visits available",
        "Customizable to your priorities",
        "Eco-friendly cleaning products",
        "100% satisfaction guarantee"
      ]}
      serviceType="Home Maintenance Cleaning"
      slug="home-maintenance"
      color="bg-indigo-50"
      iconColor="text-indigo-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}

