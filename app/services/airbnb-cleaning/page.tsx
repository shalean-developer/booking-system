import { ServicePageTemplate } from "@/components/service-page-template";
import { Calendar, Clock, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Airbnb Cleaning Services Cape Town | Turnover Cleaning | Shalean",
  description: "Professional Airbnb turnover cleaning in Cape Town. Fast, reliable cleaning between guests with same-day service. Guest-ready standards. From R230. Book trusted cleaners for your Airbnb today!",
  canonical: generateCanonical("/services/airbnb-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-airbnb-cleaning-1200x630.jpg",
    alt: "Professional Airbnb cleaning services in Cape Town - Shalean Cleaning Services"
  }
});

const faqs = [
  {
    question: "How quickly can you clean between Airbnb guests in Cape Town?",
    answer: "We offer same-day and next-day cleaning services for Airbnb turnovers across Cape Town. Our Cape Town cleaning teams are trained to work efficiently while maintaining high standards. Typical turnaround is 2-4 hours depending on property size."
  },
  {
    question: "What's included in Airbnb turnover cleaning?",
    answer: "Our Airbnb cleaning includes quick turnaround cleaning, fresh linen and towel changes, guest-ready standards inspection, quality checklist completion, key handover coordination, and sanitization of all high-touch surfaces."
  },
  {
    question: "Can you handle last-minute cleaning requests?",
    answer: "Yes! We offer emergency cleaning services for urgent turnovers. While we can't guarantee availability, we do our best to accommodate last-minute requests. Contact us as soon as possible for the best chance of same-day service."
  },
  {
    question: "Do you provide fresh linens and towels?",
    answer: "Yes, we can coordinate fresh linen and towel changes as part of the service. We work with local laundry services or can use linens you provide. This ensures your property is truly guest-ready."
  }
];

const relatedServices = [
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Thorough deep cleaning for comprehensive property reset"
  },
  {
    title: "Move-In/Out Cleaning",
    href: "/services/move-turnover",
    description: "Professional cleaning for property transitions"
  },
  {
    title: "Regular Cleaning",
    href: "/services/regular-cleaning",
    description: "Ongoing maintenance cleaning for long-term rentals"
  }
];

export default function AirbnbCleaningPage() {
  return (
    <ServicePageTemplate
      title="Airbnb Cleaning Services in Cape Town"
      description="Professional Airbnb turnover cleaning for short-term rentals in Cape Town. Fast, reliable service between guests with guest-ready standards. Serving Sea Point, Camps Bay, City Bowl, and all Cape Town areas."
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
        "Same-day Airbnb cleaning available across Cape Town",
        "Guest-ready guarantee for all properties",
        "Flexible scheduling for Cape Town hosts",
        "Emergency cleaning support for last-minute turnovers",
        "Serving all Cape Town Airbnb locations"
      ]}
      serviceType="Airbnb Turnover Cleaning"
      slug="airbnb-cleaning"
      color="bg-teal-50"
      iconColor="text-teal-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}
