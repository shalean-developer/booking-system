import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Halfway House",
    "Johannesburg",
    "Midrand",
    "Professional cleaning services in Halfway House, Johannesburg. Expert cleaners for homes and offices in this strategic Midrand location.",
    [
      "Midrand area specialists",
      "Office cleaning",
      "Residential services",
      "Strategic location"
    ]
  );
}

export default function HalfwayHousePage() {
  return (
    <SuburbPageTemplate
      suburb="Halfway House"
      city="Johannesburg"
      area="Midrand"
      description="Professional cleaning services in Halfway House, Johannesburg's strategic Midrand location. From family homes to corporate offices, we provide comprehensive cleaning solutions for this central area."
      highlights={[
        "Midrand area specialists",
        "Office cleaning services",
        "Residential cleaning",
        "Strategic location expertise",
        "Same-day service available",
        "Central area convenience"
      ]}
      available={true}
    />
  );
}
