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
    "Pietermaritzburg",
    "Durban",
    "Upper Areas",
    "Professional cleaning services in Pietermaritzburg. Serving homes, apartments, and businesses in the capital of KwaZulu-Natal.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/durban/pietermaritzburg', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function PietermaritzburgPage() {
  return (
    <SuburbPageTemplate
      suburb="Pietermaritzburg"
      city="Durban"
      area="Upper Areas"
      description="Professional cleaning services in Pietermaritzburg. Serving homes, apartments, and businesses in the capital of KwaZulu-Natal."
      available={true}
    />
  );
}

