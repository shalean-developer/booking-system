import { ServicePageTemplate } from "@/components/service-page-template";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Deep Cleaning Services | Shalean",
  description:
    "Meticulous deep cleaning for homes, apartments, and offices. Shalean tackles grime, kitchens, bathrooms, inside appliances, and hard-to-reach spaces with eco-friendly products and trusted pros.",
  canonical: generateCanonical("/services/deep-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-deep-cleaning-1200x630.jpg",
    alt: "Professional deep cleaning service in action",
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
  "Perfect for quarterly resets, move-ins, or post-renovation clean-ups",
  "Eco-conscious detergents safe for families and pets",
  "Fully vetted, insured, and supervised cleaning teams",
  "Custom checklists to match property size and priorities",
];

export default function DeepCleaningServicePage() {
  return (
    <ServicePageTemplate
      title="Deep Cleaning Services"
      description="Reset your space with a floor-to-ceiling deep clean that removes built-up grime, allergens, and hidden dust."
      icon={Sparkles}
      features={features}
      pricing="From R450"
      pricingNote="Quoted based on property size, condition, and add-ons"
      highlights={highlights}
      serviceType="Deep Cleaning"
      slug="deep-cleaning"
      color="bg-emerald-50"
      iconColor="text-emerald-600"
    />
  );
}

