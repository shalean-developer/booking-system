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
    "Kalk Bay",
    "Cape Town",
    "False Bay",
    "Charming cleaning services for Kalk Bay's unique coastal homes. Care for historic properties and beach cottages.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/kalk-bay', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function KalkBayPage() {
  return (
    <SuburbPageTemplate
      suburb="Kalk Bay"
      city="Cape Town"
      area="False Bay"
      description="Charming cleaning services for Kalk Bay's unique coastal homes. Care for historic properties and beach cottages."
      available={true}
    />
  );
}

