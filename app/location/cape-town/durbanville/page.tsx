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
    "Durbanville",
    "Cape Town",
    "Northern Suburbs",
    "Quality cleaning services for Durbanville's estates and family homes. Professional service in Cape Town's wine country.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/durbanville', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function DurbanvillePage() {
  return (
    <SuburbPageTemplate
      suburb="Durbanville"
      city="Cape Town"
      area="Northern Suburbs"
      description="Quality cleaning services for Durbanville's estates and family homes. Professional service in Cape Town's wine country."
      available={true}
    />
  );
}

