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
    "Kommetjie",
    "Cape Town",
    "West Coast",
    "Coastal cleaning services in Kommetjie. Perfect for beach cottages and holiday homes by the lighthouse.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/kommetjie', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function KommetjiePage() {
  return (
    <SuburbPageTemplate
      suburb="Kommetjie"
      city="Cape Town"
      area="West Coast"
      description="Coastal cleaning services in Kommetjie. Perfect for beach cottages and holiday homes by the lighthouse."
      available={true}
    />
  );
}

