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
    "Paarl",
    "Cape Town",
    "Winelands",
    "Professional cleaning services in Paarl. Serving wine estates, family homes, and businesses in the beautiful Winelands region.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/paarl', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function PaarlPage() {
  return (
    <SuburbPageTemplate
      suburb="Paarl"
      city="Cape Town"
      area="Winelands"
      description="Professional cleaning services in Paarl. Serving wine estates, family homes, and businesses in the beautiful Winelands region."
      available={true}
    />
  );
}

