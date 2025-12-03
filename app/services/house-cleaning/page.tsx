import { ServicePageTemplate } from "@/components/service-page-template";
import { Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Professional House Cleaning Services in Cape Town | Shalean",
  description:
    "Trusted house cleaning services in Cape Town. Professional cleaners near you. Regular & one-time cleaning. Book your free quote today with Shalean Cleaning Services.",
  canonical: generateCanonical("/services/house-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-house-cleaning-1200x630.jpg",
    alt: "Professional house cleaning service in Cape Town - Shalean Cleaning Services",
  },
});

const features = [
  "Comprehensive dusting of all surfaces and furniture",
  "Thorough vacuuming of carpets and rugs",
  "Mopping and sanitizing hard floors",
  "Kitchen cleaning including countertops, appliances, and sinks",
  "Bathroom cleaning and sanitization",
  "Trash removal and bin cleaning",
  "Surface sanitization of high-touch areas",
  "Window sill and door frame cleaning",
];

const highlights = [
  "Regular maintenance cleaning to keep your home spotless",
  "Eco-friendly cleaning products safe for families and pets",
  "Fully vetted, insured, and supervised cleaning teams",
  "Flexible scheduling to fit your lifestyle",
  "Same-day service available across Cape Town",
];

const faqs = [
  {
    question: "How often should I schedule house cleaning?",
    answer: "Most customers schedule house cleaning weekly or bi-weekly, but we offer flexible scheduling to fit your needs. You can book one-time cleaning, weekly, bi-weekly, or monthly service. Our team will work with you to find the perfect schedule."
  },
  {
    question: "What's included in a standard house cleaning?",
    answer: "Our standard house cleaning includes comprehensive dusting, vacuuming, mopping, kitchen and bathroom cleaning, trash removal, and surface sanitization. We focus on maintaining a clean, healthy living environment for your family."
  },
  {
    question: "Do I need to provide cleaning supplies?",
    answer: "No, we bring all professional-grade cleaning supplies and equipment, including eco-friendly products. You don't need to provide anything—just let us in and we'll handle the rest."
  },
  {
    question: "How long does a house cleaning take?",
    answer: "House cleaning typically takes 2-4 hours depending on property size. A 2-bedroom apartment may take 2-3 hours, while a larger 4-bedroom home can take 3-4 hours. We'll provide an estimated time when you book."
  },
  {
    question: "Can I customize what gets cleaned?",
    answer: "Absolutely! We offer custom cleaning checklists to match your priorities. You can request specific areas to focus on or skip certain tasks. Just let us know your preferences when booking."
  }
];

const relatedServices = [
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Thorough, intensive cleaning for seasonal refreshes"
  },
  {
    title: "Apartment Cleaning",
    href: "/services/apartment-cleaning",
    description: "Specialized cleaning for apartments and flats"
  },
  {
    title: "Home Maintenance",
    href: "/services/home-maintenance",
    description: "Ongoing maintenance cleaning services"
  }
];

export default function HouseCleaningServicePage() {
  return (
    <ServicePageTemplate
      title="Professional House Cleaning Services in Cape Town"
      description="Shalean Cleaning Services provides professional house cleaning in Cape Town. Our trusted team delivers thorough, reliable cleaning for your home. We use eco-friendly products and flexible scheduling to keep your space spotless. Book your cleaning service today."
      icon={Home}
      features={features}
      pricing="From R250"
      pricingNote="Quoted based on property size and frequency"
      highlights={highlights}
      serviceType="House Cleaning"
      slug="house-cleaning"
      color="bg-blue-50"
      iconColor="text-blue-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}











