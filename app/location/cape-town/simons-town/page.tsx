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
    "Simon's Town",
    "Cape Town",
    "False Bay",
    "Professional cleaning services in historic Simon's Town. Expert care for naval homes and coastal properties.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/simons-town', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function SimonsTownPage() {
  return (
    <SuburbPageTemplate
      suburb="Simon's Town"
      city="Cape Town"
      area="False Bay"
      description="Professional cleaning services in historic Simon's Town. Expert care for naval homes and coastal properties."
      available={true}
    />
  );
}

