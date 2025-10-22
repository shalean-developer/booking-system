import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Rosettenville",
    "Johannesburg",
    "Southern Suburbs",
    "Professional cleaning services in Rosettenville, Johannesburg. Expert cleaners for family homes and apartments in this established Southern Suburbs area.",
    [
      "Family-friendly specialists",
      "Apartment cleaning",
      "Regular maintenance",
      "Flexible scheduling"
    ]
  );
}

export default function RosettenvillePage() {
  return (
    <SuburbPageTemplate
      suburb="Rosettenville"
      city="Johannesburg"
      area="Southern Suburbs"
      description="Professional cleaning services in Rosettenville, Johannesburg's established Southern Suburbs area. From family homes to apartments, we provide reliable cleaning services for this community."
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
