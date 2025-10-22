import { ServicePageTemplate } from "@/components/service-page-template";
import { Calendar, Clock, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Airbnb Cleaning Services | Shalean",
  description: "Professional Airbnb turnover cleaning services. Fast, reliable cleaning between guests with same-day service. Book your trusted cleaner today!",
  canonical: "/services/airbnb-cleaning",
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-airbnb-cleaning-1200x630.jpg",
    alt: "Professional Airbnb cleaning services"
  }
});

export default function AirbnbCleaningPage() {
  return (
    <ServicePageTemplate
      title="Airbnb Cleaning Services"
      description="Professional turnover cleaning for short-term rentals. Fast, reliable service between guests with guest-ready standards every time."
      icon={Calendar}
      features={[
        "Quick turnaround cleaning",
        "Fresh linen and towel changes",
        "Guest-ready standards",
        "Quality inspection checklist",
        "Key handover coordination",
        "Same-day service available",
        "Flexible scheduling",
        "Emergency cleaning services"
      ]}
      pricing="From R230"
      pricingNote="Pricing based on property size and cleaning requirements"
      highlights={[
        "Same-day service available",
        "Guest-ready guarantee",
        "Flexible scheduling",
        "Emergency cleaning support"
      ]}
      serviceType="Airbnb Turnover Cleaning"
      slug="airbnb-cleaning"
      color="bg-teal-50"
      iconColor="text-teal-600"
    />
  );
}
