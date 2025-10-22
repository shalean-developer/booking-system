import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Southgate",
    "Johannesburg",
    "Southern Suburbs",
    "Professional cleaning services in Southgate, Johannesburg. Expert cleaners for homes and businesses in this established Southern Suburbs area.",
    [
      "Established suburb specialists",
      "Commercial cleaning",
      "Residential services",
      "Flexible scheduling"
    ]
  );
}

export default function SouthgatePage() {
  return (
    <SuburbPageTemplate
      suburb="Southgate"
      city="Johannesburg"
      area="Southern Suburbs"
      description="Professional cleaning services in Southgate, Johannesburg's established Southern Suburbs area. From family homes to commercial spaces, we provide comprehensive cleaning solutions."
      highlights={[
        "Established suburb specialists",
        "Commercial cleaning services",
        "Residential cleaning",
        "Flexible scheduling",
        "Same-day service available",
        "Community-focused approach"
      ]}
      available={true}
    />
  );
}
