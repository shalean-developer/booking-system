import { ServicePageTemplate } from "@/components/service-page-template";
import { Calendar, Clock, Shield, Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Move In/Out Cleaning Cape Town | End of Lease Cleaning | Shalean",
  description: "Professional move-in/out and end of lease cleaning in Cape Town. Fast turnaround, deposit-securing cleaning. Same-day available. From R980. Book trusted cleaners today!",
  canonical: generateCanonical("/services/move-turnover"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-move-turnover-1200x630.jpg",
    alt: "Professional move-in/out cleaning services in Cape Town - Shalean Cleaning Services"
  }
});

const faqs = [
  {
    question: "What's included in move-in/out cleaning in Cape Town?",
    answer: "Move-in/out cleaning includes complete property cleaning for transitions, detailed kitchen and bathroom cleaning, inside appliances (oven, fridge, microwave), window cleaning, carpet cleaning, baseboards and hard-to-reach areas, and end of lease inspection-ready cleaning to help secure your deposit."
  },
  {
    question: "How quickly can you clean between move-in/out?",
    answer: "We offer same-day and next-day move-in/out cleaning services across Cape Town. Our cleaning teams are trained to work efficiently while maintaining high standards. Typical turnaround is 4-8 hours depending on property size."
  },
  {
    question: "Will the cleaning help me get my deposit back?",
    answer: "Yes! Our end of lease cleaning is designed to meet landlord and property manager standards. We clean to inspection-ready standards, including inside appliances, behind furniture, and all hard-to-reach areas that are typically checked during move-out inspections."
  },
  {
    question: "Do you clean inside appliances for move-out?",
    answer: "Yes, we include inside appliance cleaning (oven, fridge, microwave) as part of our move-out cleaning service. This is essential for end of lease cleaning and helps ensure you meet all cleaning requirements."
  },
  {
    question: "Can you handle Airbnb turnover cleaning?",
    answer: "Absolutely! We specialize in fast, thorough Airbnb turnover cleaning between guests. Our service includes quick turnaround, fresh linen coordination, guest-ready standards inspection, and quality checklist completion to maintain your 5-star ratings."
  }
];

const relatedServices = [
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Comprehensive deep cleaning for thorough property reset"
  },
  {
    title: "Airbnb Cleaning",
    href: "/services/airbnb-cleaning",
    description: "Fast turnover cleaning for short-term rentals"
  },
  {
    title: "Regular Cleaning",
    href: "/services/regular-cleaning",
    description: "Ongoing maintenance cleaning for long-term properties"
  }
];

export default function MoveTurnoverPage() {
  return (
    <ServicePageTemplate
      title="Move In/Out & Turnover Cleaning in Cape Town"
      description="Professional move-in/out and Airbnb turnover cleaning services in Cape Town. End of lease cleaning, same-day available. Fast turnaround to prepare your property quickly for new occupants. Serving Sea Point, Claremont, Constantia, and all Cape Town suburbs."
      icon={Calendar}
      features={[
        "Complete move-in/out cleaning",
        "End of lease inspection-ready",
        "Inside appliance cleaning",
        "Fast turnaround service",
        "Airbnb turnover cleaning",
        "Carpet and floor deep cleaning",
        "Window and frame cleaning",
        "Deposit-securing guarantee"
      ]}
      pricing="From R980"
      pricingNote="Pricing based on property size and cleaning requirements"
      highlights={[
        "Same-day move-in/out cleaning available across Cape Town",
        "Inspection-ready guarantee for deposits",
        "Fast turnaround for quick transitions",
        "Airbnb turnover specialists",
        "Serving all Cape Town suburbs"
      ]}
      serviceType="Move In/Out & Turnover Cleaning"
      slug="move-turnover"
      color="bg-rose-50"
      iconColor="text-rose-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}

