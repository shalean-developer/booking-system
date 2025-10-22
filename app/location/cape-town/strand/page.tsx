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
    "Strand",
    "Cape Town",
    "Helderberg",
    "Affordable cleaning services in Strand. Reliable service for Helderberg beachfront and residential properties.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/strand', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function StrandPage() {
  return (
    <SuburbPageTemplate
      suburb="Strand"
      city="Cape Town"
      area="Helderberg"
      description="Affordable cleaning services in Strand. Reliable service for Helderberg beachfront and residential properties."
      available={true}
    />
  );
}

