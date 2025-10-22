import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Apartment & house cleaning",
    "Regular & deep cleaning services",
    "Same-day booking available",
    "Professional equipment & products",
    "Insured & bonded cleaners",
    "Competitive pricing"
  ];

  const locationMetadata = createLocationMetadata(
    "Stellenbosch",
    "Cape Town",
    "Winelands",
    "Professional cleaning services in Stellenbosch. Serving wine estates, student accommodation, and family homes in the heart of the Winelands.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/stellenbosch', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function StellenboschPage() {
  return (
    <SuburbPageTemplate
      suburb="Stellenbosch"
      city="Cape Town"
      area="Winelands"
      description="Professional cleaning services in Stellenbosch. Serving wine estates, student accommodation, and family homes in the heart of the Winelands."
      available={true}
    />
  );
}

