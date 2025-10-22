import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Kempton Park",
    "Johannesburg",
    "Eastern Suburbs",
    "Professional cleaning services in Kempton Park, Johannesburg. Expert cleaners for homes and businesses near OR Tambo Airport.",
    [
      "Airport area specialists",
      "Commercial cleaning",
      "Residential services",
      "Flexible scheduling"
    ]
  );
}

export default function KemptonParkPage() {
  return (
    <SuburbPageTemplate
      suburb="Kempton Park"
      city="Johannesburg"
      area="Eastern Suburbs"
      description="Professional cleaning services in Kempton Park, Johannesburg's Eastern Suburbs area near OR Tambo Airport. From family homes to commercial spaces, we provide comprehensive cleaning solutions."
      highlights={[
        "Airport area specialists",
        "Commercial cleaning services",
        "Residential cleaning",
        "Flexible scheduling",
        "Same-day service available",
        "Transport hub convenience"
      ]}
      available={true}
    />
  );
}
