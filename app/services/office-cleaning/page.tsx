import { ServicePageTemplate } from "@/components/service-page-template";
import { Building, Clock, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Office Cleaning Services | Shalean",
  description: "Professional commercial office cleaning services. Keep your workplace clean and productive with our experienced commercial cleaners.",
  canonical: generateCanonical("/services/office-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-office-cleaning-1200x630.jpg",
    alt: "Professional office cleaning services"
  }
});

export default function OfficeCleaningPage() {
  return (
    <ServicePageTemplate
      title="Office Cleaning Services"
      description="Professional commercial cleaning services for offices and workplaces. Keep your business environment clean, healthy, and productive."
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
    />
  );
}
