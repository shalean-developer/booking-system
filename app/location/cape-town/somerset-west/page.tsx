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
    "Somerset West",
    "Cape Town",
    "Helderberg",
    "Quality cleaning services in Somerset West. Professional care for Helderberg estates and family homes.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/somerset-west', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function SomersetWestPage() {
  return (
    <SuburbPageTemplate
      suburb="Somerset West"
      city="Cape Town"
      area="Helderberg"
      description="Quality cleaning services in Somerset West. Professional care for Helderberg estates and family homes."
      available={true}
    />
  );
}

