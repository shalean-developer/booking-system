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
    "Plumstead",
    "Cape Town",
    "Southern Suburbs",
    "Professional cleaning services in Plumstead. Affordable, quality service for Southern Suburbs families.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/plumstead', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function PlumsteadPage() {
  return (
    <SuburbPageTemplate
      suburb="Plumstead"
      city="Cape Town"
      area="Southern Suburbs"
      description="Professional cleaning services in Plumstead. Affordable, quality service for Southern Suburbs families."
      available={true}
    />
  );
}

