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
    "Wynberg",
    "Cape Town",
    "Southern Suburbs",
    "Reliable cleaning services in Wynberg. Professional care for Southern Suburbs homes and businesses.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/wynberg', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function WynbergPage() {
  return (
    <SuburbPageTemplate
      suburb="Wynberg"
      city="Cape Town"
      area="Southern Suburbs"
      description="Reliable cleaning services in Wynberg. Professional care for Southern Suburbs homes and businesses."
      available={true}
    />
  );
}

