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
    />
  );
}
