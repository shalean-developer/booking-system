import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Family home specialists",
    "Apartment & house cleaning",
    "Regular & deep cleaning services",
    "Same-day booking available",
    "Professional equipment & products",
    "Insured & bonded cleaners"
  ];

  const locationMetadata = createLocationMetadata(
    "Brackenfell",
    "Cape Town",
    "Northern Suburbs",
    "Professional cleaning services for Brackenfell families. Reliable, friendly service for Northern Suburbs homes.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/brackenfell', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function BrackenfellPage() {
  return (
    <SuburbPageTemplate
      suburb="Brackenfell"
      city="Cape Town"
      area="Northern Suburbs"
      description="Professional cleaning services for Brackenfell families. Reliable, friendly service for Northern Suburbs homes."
      available={true}
    />
  );
}

