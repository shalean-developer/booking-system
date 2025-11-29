import { ServicePageTemplate } from "@/components/service-page-template";
import { Building, Clock, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Office Cleaning Services Cape Town | Commercial Cleaning | Shalean",
  description: "Professional commercial office cleaning services in Cape Town. Keep your workplace clean and productive. Desk cleaning, reception maintenance, kitchen cleaning, and restroom sanitization. From R180. Book today!",
  canonical: generateCanonical("/services/office-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-office-cleaning-1200x630.jpg",
    alt: "Professional office cleaning services in Cape Town - Shalean Cleaning Services"
  }
});

const faqs = [
  {
    question: "What's included in office cleaning services in Cape Town?",
    answer: "Our office cleaning includes desk and workstation cleaning, reception area maintenance, kitchen and break room cleaning, restroom sanitization, floor vacuuming and mopping, trash removal and recycling, window cleaning, and meeting room preparation. We tailor our service to your office layout and specific needs."
  },
  {
    question: "Can you clean after business hours?",
    answer: "Yes! We offer after-hours cleaning services to minimize disruption to your business operations. Our Cape Town cleaning teams can work evenings, weekends, or early mornings to ensure your office is spotless before your team arrives."
  },
  {
    question: "How often should I schedule office cleaning?",
    answer: "Most Cape Town businesses choose daily, weekly, or bi-weekly cleaning depending on office size, foot traffic, and budget. We can customize a cleaning schedule that works best for your business operations and ensures a consistently clean workplace."
  },
  {
    question: "Do you provide cleaning supplies and equipment?",
    answer: "Yes, we bring all commercial-grade cleaning equipment and supplies. This includes professional vacuums, mops, eco-friendly cleaning products, and all necessary tools. You don't need to provide anything—we come fully equipped."
  },
  {
    question: "Are your cleaners insured for commercial properties?",
    answer: "Absolutely. All our cleaners are fully bonded and insured, providing protection for your office property and equipment. We maintain comprehensive insurance coverage specifically for commercial cleaning services across Cape Town."
  }
];

const relatedServices = [
  {
    title: "Regular Cleaning",
    href: "/services/regular-cleaning",
    description: "Maintain your home with weekly or bi-weekly regular cleaning services"
  },
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Comprehensive deep cleaning for thorough office reset"
  },
  {
    title: "Home Maintenance",
    href: "/services/home-maintenance",
    description: "Ongoing maintenance cleaning to keep your space spotless"
  }
];

export default function OfficeCleaningPage() {
  return (
    <ServicePageTemplate
      title="Office Cleaning Services in Cape Town"
      description="Professional commercial cleaning services for offices and workplaces in Cape Town. Keep your business environment clean, healthy, and productive. Serving businesses across Cape Town CBD, Claremont, and all commercial areas."
      icon={Building}
      features={[
        "Desk and workstation cleaning",
        "Reception area maintenance",
        "Kitchen and break room cleaning",
        "Restroom sanitization",
        "Floor vacuuming and mopping",
        "Trash removal and recycling",
        "Window cleaning",
        "Meeting room preparation"
      ]}
      pricing="From R180"
      pricingNote="Custom pricing based on office size and cleaning frequency"
      highlights={[
        "After-hours cleaning available",
        "Commercial-grade equipment",
        "Flexible scheduling",
        "Bonded and insured cleaners"
      ]}
      serviceType="Commercial Office Cleaning"
      slug="office-cleaning"
      color="bg-blue-50"
      iconColor="text-blue-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}
