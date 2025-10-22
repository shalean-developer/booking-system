import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Benoni",
    "Johannesburg",
    "Eastern Suburbs",
    "Professional cleaning services in Benoni, Johannesburg. Trusted cleaners for homes and apartments in this established Eastern Suburbs area.",
    [
      "Established suburb specialists",
      "Family-friendly cleaning",
      "Flexible scheduling",
      "Competitive pricing"
    ]
  );
}

export default function BenoniPage() {
  return (
    <SuburbPageTemplate
      suburb="Benoni"
      city="Johannesburg"
      area="Eastern Suburbs"
      description="Professional cleaning services in Benoni, Johannesburg's established Eastern Suburbs area. From family homes to apartments, we provide reliable cleaning services for this growing community."
      highlights={[
        "Established suburb specialists",
        "Family-friendly cleaning services",
        "Flexible scheduling options",
        "Competitive pricing",
        "Same-day service available",
        "Eco-friendly products available"
      ]}
      available={true}
    />
  );
}
