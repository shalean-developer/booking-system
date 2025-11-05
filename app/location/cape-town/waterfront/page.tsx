import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "V&A Waterfront area specialists",
    "Apartment & residential cleaning",
    "Commercial cleaning services",
    "Tourist accommodation cleaning",
    "Flexible scheduling",
    "Professional & trustworthy cleaners"
  ];

  const locationMetadata = createLocationMetadata(
    "V&A Waterfront",
    "Cape Town",
    "Atlantic Seaboard",
    "Professional cleaning services in the V&A Waterfront area. We provide expert cleaning for apartments, homes, and commercial spaces in this iconic Cape Town location.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/waterfront', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function WaterfrontPage() {
  return (
    <SuburbPageTemplate
      suburb="V&A Waterfront"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Professional cleaning services in the V&A Waterfront area. We provide expert cleaning for apartments, homes, and commercial spaces in this iconic Cape Town location."
      available={true}
      highlights={[
        "V&A Waterfront area specialists",
        "Apartment & residential cleaning",
        "Commercial cleaning services",
        "Tourist accommodation cleaning",
        "Flexible scheduling",
        "Professional & trustworthy cleaners"
      ]}
    />
  );
}

