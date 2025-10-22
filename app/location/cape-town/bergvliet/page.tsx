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
    "Bergvliet",
    "Cape Town",
    "Southern Suburbs",
    "Reliable cleaning services in Bergvliet. Professional care for Southern Suburbs family homes.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/bergvliet', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function BergvlietPage() {
  return (
    <SuburbPageTemplate
      suburb="Bergvliet"
      city="Cape Town"
      area="Southern Suburbs"
      description="Reliable cleaning services in Bergvliet. Professional care for Southern Suburbs family homes."
      available={true}
    />
  );
}

