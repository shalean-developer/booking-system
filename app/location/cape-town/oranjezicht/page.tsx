import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Historic home specialists",
    "Apartment & house cleaning",
    "Regular & deep cleaning services",
    "Same-day booking available",
    "Professional equipment & products",
    "Insured & bonded cleaners"
  ];

  const locationMetadata = createLocationMetadata(
    "Oranjezicht",
    "Cape Town",
    "City Bowl",
    "Professional cleaning services in Oranjezicht. Expert care for your City Bowl home with mountain views.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/oranjezicht', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function OranjezichtPage() {
  return (
    <SuburbPageTemplate
      suburb="Oranjezicht"
      city="Cape Town"
      area="City Bowl"
      description="Professional cleaning services in Oranjezicht. Expert care for your City Bowl home with mountain views."
      available={true}
    />
  );
}

