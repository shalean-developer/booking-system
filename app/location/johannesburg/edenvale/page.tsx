import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Edenvale",
    "Johannesburg",
    "Eastern Suburbs",
    "Professional cleaning services in Edenvale, Johannesburg. Trusted cleaners for family homes and apartments in this established Eastern Suburbs community.",
    [
      "Family-friendly specialists",
      "Apartment cleaning",
      "Regular maintenance",
      "Flexible scheduling"
    ]
  );
}

export default function EdenvalePage() {
  return (
    <SuburbPageTemplate
      suburb="Edenvale"
      city="Johannesburg"
      area="Eastern Suburbs"
      description="Professional cleaning services in Edenvale, Johannesburg's established Eastern Suburbs community. From family homes to apartments, we provide reliable cleaning services for this growing area."
      highlights={[
        "Family-friendly specialists",
        "Apartment cleaning services",
        "Regular maintenance cleaning",
        "Flexible scheduling",
        "Same-day service available",
        "Community-focused service"
      ]}
      available={true}
    />
  );
}
