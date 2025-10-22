import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Historic home specialists",
    "Apartment & house cleaning",
    "Regular & deep cleaning services",
    "Same-day booking available",
    "Professional equipment & products",
    "Insured & bonded cleaners"
  ];

  const locationMetadata = createLocationMetadata(
    "Tamboerskloof",
    "Cape Town",
    "City Bowl",
    "Quality cleaning services for Tamboerskloof's beautiful homes and apartments. Professional care in the heart of the City Bowl.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/tamboerskloof', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function TamboerskloofPage() {
  return (
    <SuburbPageTemplate
      suburb="Tamboerskloof"
      city="Cape Town"
      area="City Bowl"
      description="Quality cleaning services for Tamboerskloof's beautiful homes and apartments. Professional care in the heart of the City Bowl."
      available={true}
    />
  );
}

