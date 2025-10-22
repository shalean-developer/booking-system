import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Boksburg",
    "Johannesburg",
    "Eastern Suburbs",
    "Professional cleaning services in Boksburg, Johannesburg. Expert cleaners for homes and businesses in this industrial and residential Eastern Suburbs area.",
    [
      "Industrial area specialists",
      "Commercial cleaning",
      "Residential services",
      "Flexible scheduling"
    ]
  );
}

export default function BoksburgPage() {
  return (
    <SuburbPageTemplate
      suburb="Boksburg"
      city="Johannesburg"
      area="Eastern Suburbs"
      description="Professional cleaning services in Boksburg, Johannesburg's industrial and residential Eastern Suburbs area. From family homes to commercial spaces, we provide comprehensive cleaning solutions."
      highlights={[
        "Industrial area specialists",
        "Commercial cleaning services",
        "Residential cleaning experts",
        "Flexible scheduling",
        "Same-day service available",
        "Competitive pricing"
      ]}
      available={true}
    />
  );
}
