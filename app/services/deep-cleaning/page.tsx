import { ServicePageTemplate } from "@/components/service-page-template";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Deep Cleaning Services Cape Town | Professional Deep Clean | Shalean",
  description:
    "Professional deep cleaning services in Cape Town. Thorough cleaning of kitchens, bathrooms, carpets, and hard-to-reach spaces. Same-day available. From R450. Book vetted cleaners today!",
  canonical: generateCanonical("/services/deep-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-deep-cleaning-1200x630.jpg",
    alt: "Professional deep cleaning service in Cape Town - Shalean Cleaning Services",
  },
});

const features = [
  "Detailed kitchen degreasing (appliances, cabinets, backsplashes)",
  "Bathroom sanitisation including tiles, grout, taps, and glass",
  "Interior window, sill, and door frame cleaning",
  "Baseboards, skirtings, and hard-to-reach dust removal",
  "Inside fridge, oven, and microwave on request",
  "Light fixture, ceiling fan, and vent dusting",
  "Furniture vacuuming and spot treatment",
  "High-touch point disinfection throughout",
];

const highlights = [
  "Perfect for quarterly resets, move-ins, or post-renovation clean-ups in Cape Town",
  "Eco-conscious detergents safe for families and pets",
  "Fully vetted, insured, and supervised cleaning teams serving Cape Town",
  "Custom checklists to match property size and priorities",
  "Same-day deep cleaning available across Cape Town suburbs",
];

const faqs = [
  {
    question: "How often should I schedule deep cleaning in Cape Town?",
    answer: "Deep cleaning is recommended every 3-6 months, or when moving in/out, after renovations, or when regular cleaning isn't enough. Our Cape Town cleaning teams specialize in removing built-up grime, allergens, and hard-to-reach dust that accumulates over time."
  },
  {
    question: "What's included in a deep cleaning service?",
    answer: "Our deep cleaning includes detailed kitchen degreasing (appliances, cabinets, backsplashes), bathroom sanitization (tiles, grout, taps, glass), interior window and door frame cleaning, baseboards and hard-to-reach dust removal, inside appliances on request, light fixture and vent dusting, furniture vacuuming, and high-touch point disinfection throughout your home."
  },
  {
    question: "How long does a deep clean take?",
    answer: "Deep cleaning typically takes 4-8 hours depending on property size and condition. A 2-bedroom apartment may take 4-5 hours, while a larger 4-bedroom home can take 6-8 hours. We'll provide an estimated time when you book."
  },
  {
    question: "Do I need to provide cleaning supplies?",
    answer: "No, we bring all professional-grade cleaning supplies and equipment, including eco-friendly products that are safe for your family and pets. You don't need to provide anything—just let us in and we'll handle the rest."
  },
  {
    question: "Can I customize what gets deep cleaned?",
    answer: "Absolutely! We offer custom checklists to match your property size and priorities. You can request specific areas like inside appliances, behind furniture, or focus on particular rooms. Just let us know your preferences when booking."
  }
];

const relatedServices = [
  {
    title: "Regular Cleaning",
    href: "/services/regular-cleaning",
    description: "Maintain your home with weekly or bi-weekly regular cleaning services"
  },
  {
    title: "Move-In/Out Cleaning",
    href: "/services/move-turnover",
    description: "Professional cleaning for moving in or out of your property"
  },
  {
    title: "Home Maintenance",
    href: "/services/home-maintenance",
    description: "Ongoing maintenance cleaning to keep your home spotless"
  }
];

export default function DeepCleaningServicePage() {
  return (
    <ServicePageTemplate
      title="Deep Cleaning Services in Cape Town"
      description="Reset your Cape Town home or office with a floor-to-ceiling deep clean that removes built-up grime, allergens, and hidden dust. Professional deep cleaning services across Sea Point, Claremont, Constantia, and all Cape Town suburbs."
      icon={Sparkles}
      features={features}
      pricing="From R450"
      pricingNote="Quoted based on property size, condition, and add-ons"
      highlights={highlights}
      serviceType="Deep Cleaning"
      slug="deep-cleaning"
      color="bg-emerald-50"
      iconColor="text-emerald-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}

