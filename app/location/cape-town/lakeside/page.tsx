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
    "Lakeside",
    "Cape Town",
    "False Bay",
    "Quality cleaning services in Lakeside. Professional care for False Bay family homes.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/lakeside', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function LakesidePage() {
  return (
    <SuburbPageTemplate
      suburb="Lakeside"
      city="Cape Town"
      area="False Bay"
      description="Quality cleaning services in Lakeside. Professional care for False Bay family homes."
      available={true}
    />
  );
}

