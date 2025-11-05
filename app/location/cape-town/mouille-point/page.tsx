import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Coastal area cleaning specialists",
    "Apartment & residential cleaning",
    "Deep cleaning services",
    "Flexible scheduling",
    "Professional & reliable cleaners",
    "Competitive pricing"
  ];

  const locationMetadata = createLocationMetadata(
    "Mouille Point",
    "Cape Town",
    "Atlantic Seaboard",
    "Professional cleaning services in Mouille Point. Located near the V&A Waterfront, we provide expert cleaning services for apartments and homes in this vibrant coastal area.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/mouille-point', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function MouillePointPage() {
  return (
    <SuburbPageTemplate
      suburb="Mouille Point"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Professional cleaning services in Mouille Point. Located near the V&A Waterfront, we provide expert cleaning services for apartments and homes in this vibrant coastal area."
      available={true}
      highlights={[
        "Coastal area cleaning specialists",
        "Apartment & residential cleaning",
        "Deep cleaning services",
        "Flexible scheduling",
        "Professional & reliable cleaners",
        "Competitive pricing"
      ]}
    />
  );
}

