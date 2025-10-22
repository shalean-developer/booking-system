import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Roodepoort",
    "Johannesburg",
    "Western Suburbs",
    "Professional cleaning services in Roodepoort, Johannesburg. Trusted cleaners for family homes and apartments in this established Western Suburbs area.",
    [
      "Family-friendly specialists",
      "Apartment cleaning",
      "Regular maintenance",
      "Flexible scheduling"
    ]
  );
}

export default function RoodepoortPage() {
  return (
    <SuburbPageTemplate
      suburb="Roodepoort"
      city="Johannesburg"
      area="Western Suburbs"
      description="Professional cleaning services in Roodepoort, Johannesburg's established Western Suburbs area. From family homes to apartments, we provide reliable cleaning services for this community."
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
