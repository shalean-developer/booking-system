import { ServicePageTemplate } from "@/components/service-page-template";
import { Home, Calendar, Building, Users, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Regular Cleaning Services | Shalean",
  description: "Professional regular home cleaning services. Weekly and bi-weekly maintenance cleaning to keep your space fresh and organized. Book today!",
  canonical: "/services/regular-cleaning",
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-regular-cleaning-1200x630.jpg",
    alt: "Professional regular cleaning services"
  }
});

export default function RegularCleaningPage() {
  return (
    <ServicePageTemplate
      title="Regular Cleaning Services"
      description="Keep your home fresh and organized with our professional regular cleaning services. Perfect for ongoing maintenance and busy lifestyles."
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
        "Flexible scheduling options",
        "Eco-friendly cleaning products",
        "Insured and bonded cleaners",
        "100% satisfaction guarantee"
      ]}
      serviceType="Regular Home Cleaning"
      slug="regular-cleaning"
      color="bg-amber-50"
      iconColor="text-amber-600"
    />
  );
}
