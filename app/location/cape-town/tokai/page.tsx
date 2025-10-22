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
    "Tokai",
    "Cape Town",
    "Southern Suburbs",
    "Professional cleaning services in Tokai. Quality care for your Southern Suburbs home near the forest.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/tokai', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function TokaiPage() {
  return (
    <SuburbPageTemplate
      suburb="Tokai"
      city="Cape Town"
      area="Southern Suburbs"
      description="Professional cleaning services in Tokai. Quality care for your Southern Suburbs home near the forest."
      available={true}
    />
  );
}

