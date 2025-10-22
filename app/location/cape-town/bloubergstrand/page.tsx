import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Beachfront property specialists",
    "Apartment & house cleaning",
    "Regular & deep cleaning services",
    "Same-day booking available",
    "Professional equipment & products",
    "Insured & bonded cleaners"
  ];

  const locationMetadata = createLocationMetadata(
    "Bloubergstrand",
    "Cape Town",
    "Northern Suburbs",
    "Reliable cleaning for Bloubergstrand's beachfront properties. Perfect for holiday homes and permanent residences along the west coast.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/bloubergstrand', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function BloubergstrandPage() {
  return (
    <SuburbPageTemplate
      suburb="Bloubergstrand"
      city="Cape Town"
      area="Northern Suburbs"
      description="Reliable cleaning for Bloubergstrand's beachfront properties. Perfect for holiday homes and permanent residences along the west coast."
      available={true}
    />
  );
}

