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
    "Kenilworth",
    "Cape Town",
    "Southern Suburbs",
    "Quality cleaning services in Kenilworth. Professional service for Southern Suburbs homes and offices.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/kenilworth', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function KenilworthPage() {
  return (
    <SuburbPageTemplate
      suburb="Kenilworth"
      city="Cape Town"
      area="Southern Suburbs"
      description="Quality cleaning services in Kenilworth. Professional service for Southern Suburbs homes and offices."
      available={true}
    />
  );
}

