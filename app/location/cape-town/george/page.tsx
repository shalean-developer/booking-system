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
    "George",
    "Cape Town",
    "Garden Route",
    "Professional cleaning services in George. Serving homes, apartments, and businesses in the heart of the Garden Route.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/george', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function GeorgePage() {
  return (
    <SuburbPageTemplate
      suburb="George"
      city="Cape Town"
      area="Garden Route"
      description="Professional cleaning services in George. Serving homes, apartments, and businesses in the heart of the Garden Route."
      available={true}
    />
  );
}

