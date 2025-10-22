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
    "Scarborough",
    "Cape Town",
    "West Coast",
    "Professional cleaning services for Scarborough's remote beach properties. Quality care at the end of the peninsula.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/scarborough', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function ScarboroughPage() {
  return (
    <SuburbPageTemplate
      suburb="Scarborough"
      city="Cape Town"
      area="West Coast"
      description="Professional cleaning services for Scarborough's remote beach properties. Quality care at the end of the peninsula."
      available={true}
    />
  );
}

