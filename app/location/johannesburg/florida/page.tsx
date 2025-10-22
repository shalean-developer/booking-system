import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Florida",
    "Johannesburg",
    "Western Suburbs",
    "Professional cleaning services in Florida, Johannesburg. Expert cleaners for homes and apartments in this established Western Suburbs area.",
    [
      "Established suburb specialists",
      "Family home cleaning",
      "Apartment services",
      "Flexible scheduling"
    ]
  );
}

export default function FloridaPage() {
  return (
    <SuburbPageTemplate
      suburb="Florida"
      city="Johannesburg"
      area="Western Suburbs"
      description="Professional cleaning services in Florida, Johannesburg's established Western Suburbs area. From family homes to apartments, we provide comprehensive cleaning solutions for this community."
      highlights={[
        "Established suburb specialists",
        "Family home cleaning",
        "Apartment cleaning services",
        "Flexible scheduling",
        "Same-day service available",
        "Community-focused approach"
      ]}
      available={true}
    />
  );
}
