import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Melrose",
    "Johannesburg",
    "Northern Suburbs",
    "Professional cleaning services in Melrose, Johannesburg. Expert cleaners for luxury homes and apartments in this upmarket Northern Suburbs area.",
    [
      "Luxury home specialists",
      "Apartment cleaning",
      "Premium services",
      "Flexible scheduling"
    ]
  );
}

export default function MelrosePage() {
  return (
    <SuburbPageTemplate
      suburb="Melrose"
      city="Johannesburg"
      area="Northern Suburbs"
      description="Professional cleaning services in Melrose, Johannesburg's upmarket Northern Suburbs area. From luxury homes to apartments, we provide premium cleaning services for this prestigious community."
      highlights={[
        "Luxury home specialists",
        "Apartment cleaning services",
        "Premium cleaning services",
        "Flexible scheduling",
        "Same-day service available",
        "High-end area expertise"
      ]}
      available={true}
    />
  );
}
