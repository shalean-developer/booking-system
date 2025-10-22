import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Randburg",
    "Johannesburg",
    "Northern Suburbs",
    "Professional cleaning services in Randburg, Johannesburg. Expert cleaners for homes and businesses in this established Northern Suburbs area.",
    [
      "Established suburb specialists",
      "Commercial cleaning",
      "Residential services",
      "Flexible scheduling"
    ]
  );
}

export default function RandburgPage() {
  return (
    <SuburbPageTemplate
      suburb="Randburg"
      city="Johannesburg"
      area="Northern Suburbs"
      description="Professional cleaning services in Randburg, Johannesburg's established Northern Suburbs area. From family homes to commercial spaces, we provide comprehensive cleaning solutions."
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
