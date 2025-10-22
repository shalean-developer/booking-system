import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Experienced with luxury properties",
    "Airbnb & holiday rental specialists",
    "Ocean view apartment cleaning",
    "Same-day service available",
    "Eco-friendly products available",
    "Fully insured and vetted cleaners"
  ];

  const locationMetadata = createLocationMetadata(
    "Camps Bay",
    "Cape Town",
    "Atlantic Seaboard",
    "Professional cleaning services for your Camps Bay home or apartment. Trusted by locals and property managers in one of Cape Town's most prestigious coastal suburbs.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/camps-bay', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function CampsBayPage() {
  return (
    <SuburbPageTemplate
      suburb="Camps Bay"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Professional cleaning services for your Camps Bay home or apartment. Trusted by locals and property managers in one of Cape Town's most prestigious coastal suburbs."
      available={true}
      highlights={[
        "Experienced with luxury properties",
        "Airbnb & holiday rental specialists",
        "Ocean view apartment cleaning",
        "Same-day service available",
        "Eco-friendly products available",
        "Fully insured and vetted cleaners"
      ]}
    />
  );
}

