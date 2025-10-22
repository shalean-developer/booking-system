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
    "Noordhoek",
    "Cape Town",
    "West Coast",
    "Professional cleaning services for Noordhoek's beach homes and farm properties. Quality care in this scenic coastal village.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/noordhoek', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function NoordhoekPage() {
  return (
    <SuburbPageTemplate
      suburb="Noordhoek"
      city="Cape Town"
      area="West Coast"
      description="Professional cleaning services for Noordhoek's beach homes and farm properties. Quality care in this scenic coastal village."
      available={true}
    />
  );
}

