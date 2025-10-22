import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Luxury beachfront property specialists",
    "Exclusive residential cleaning",
    "High-end apartment maintenance",
    "Discretion & privacy guaranteed",
    "Premium cleaning products",
    "Flexible scheduling available"
  ];

  const locationMetadata = createLocationMetadata(
    "Clifton",
    "Cape Town",
    "Atlantic Seaboard",
    "Premium cleaning services for Clifton's exclusive beachfront properties. Specialized in luxury homes and holiday rentals along Cape Town's most prestigious beaches.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/clifton', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function CliftonPage() {
  return (
    <SuburbPageTemplate
      suburb="Clifton"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Premium cleaning services for Clifton's exclusive beachfront properties. Specialized in luxury homes and holiday rentals along Cape Town's most prestigious beaches."
      available={true}
    />
  );
}

