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
    "Parow",
    "Cape Town",
    "Northern Suburbs",
    "Affordable, reliable cleaning services in Parow. Quality home cleaning at competitive rates.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/parow', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function ParowPage() {
  return (
    <SuburbPageTemplate
      suburb="Parow"
      city="Cape Town"
      area="Northern Suburbs"
      description="Affordable, reliable cleaning services in Parow. Quality home cleaning at competitive rates."
      available={true}
    />
  );
}

