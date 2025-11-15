import { ServicePageTemplate } from "@/components/service-page-template";
import { Home, Calendar, Building, Users, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Regular Cleaning Services Cape Town | House Cleaning | Shalean",
  description: "Professional regular house cleaning services in Cape Town. Weekly and bi-weekly maintenance cleaning to keep your home fresh. Same-day available. From R250. Book trusted cleaners today!",
  canonical: generateCanonical("/services/regular-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-regular-cleaning-1200x630.jpg",
    alt: "Professional regular cleaning services in Cape Town - Shalean Cleaning Services"
  }
});

const faqs = [
  {
    question: "How often should I schedule regular cleaning in Cape Town?",
    answer: "Most Cape Town customers choose weekly or bi-weekly cleaning. Weekly cleaning is ideal for busy households, while bi-weekly works well for smaller spaces or less frequent needs. We also offer monthly cleaning for low-traffic areas across all Cape Town suburbs."
  },
  {
    question: "Can I customize what gets cleaned during regular visits?",
    answer: "Absolutely! We create a custom cleaning checklist based on your preferences. You can prioritize specific areas, request special attention to certain rooms, or add/remove tasks as needed. We'll adjust our service to match your lifestyle."
  },
  {
    question: "Will I have the same cleaner each time?",
    answer: "We do our best to assign the same cleaner for consistency, especially for recurring customers. This helps build trust and ensures your cleaner knows your preferences. If your regular cleaner is unavailable, we'll send a vetted replacement."
  },
  {
    question: "What's included in a regular cleaning service?",
    answer: "Regular cleaning includes dusting and vacuuming all surfaces, kitchen and bathroom cleaning, floor mopping and sanitization, trash removal, surface sanitization, light fixture cleaning, window sill cleaning, and appliance exterior cleaning."
  }
];

const relatedServices = [
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Comprehensive deep cleaning for thorough home reset"
  },
  {
    title: "Home Maintenance",
    href: "/services/home-maintenance",
    description: "Ongoing maintenance cleaning to keep your home spotless"
  },
  {
    title: "Move-In/Out Cleaning",
    href: "/services/move-turnover",
    description: "Professional cleaning for moving in or out"
  }
];

export default function RegularCleaningPage() {
  return (
    <ServicePageTemplate
      title="Regular Cleaning Services in Cape Town"
      description="Keep your Cape Town home fresh and organized with our professional regular cleaning services. Perfect for ongoing maintenance across Sea Point, Claremont, Constantia, and all Cape Town suburbs. Same-day service available."
      icon={Home}
      features={[
        "Dusting and vacuuming all surfaces",
        "Kitchen and bathroom deep cleaning",
        "Floor mopping and sanitization",
        "Trash removal and recycling",
        "Surface sanitization",
        "Light fixture cleaning",
        "Window sill cleaning",
        "Appliance exterior cleaning"
      ]}
      pricing="From R250"
      pricingNote="Price varies based on home size and frequency"
      highlights={[
        "Flexible scheduling options across Cape Town",
        "Eco-friendly cleaning products safe for families",
        "Insured and bonded cleaners serving Cape Town",
        "100% satisfaction guarantee",
        "Same-day regular cleaning available"
      ]}
      serviceType="Regular Home Cleaning"
      slug="regular-cleaning"
      color="bg-amber-50"
      iconColor="text-amber-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}
