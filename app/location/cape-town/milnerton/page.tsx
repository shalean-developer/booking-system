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
    "Milnerton",
    "Cape Town",
    "Northern Suburbs",
    "Professional cleaning services for Milnerton homes and apartments. Quality service for Northern Suburbs residents.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/milnerton', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function MilnertonPage() {
  return (
    <SuburbPageTemplate
      suburb="Milnerton"
      city="Cape Town"
      area="Northern Suburbs"
      description="Professional cleaning services for Milnerton homes and apartments. Quality service for Northern Suburbs residents."
      available={true}
    />
  );
}

