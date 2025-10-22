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
    "Fish Hoek",
    "Cape Town",
    "False Bay",
    "Professional cleaning services in Fish Hoek. Perfect for beachfront properties and family homes along False Bay.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/fish-hoek', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function FishHoekPage() {
  return (
    <SuburbPageTemplate
      suburb="Fish Hoek"
      city="Cape Town"
      area="False Bay"
      description="Professional cleaning services in Fish Hoek. Perfect for beachfront properties and family homes along False Bay."
      available={true}
    />
  );
}

