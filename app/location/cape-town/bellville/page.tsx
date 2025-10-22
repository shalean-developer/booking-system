import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Office & commercial cleaning",
    "Residential home cleaning",
    "Medical facility cleaning",
    "Regular maintenance programs",
    "Competitive business rates",
    "Reliable local team"
  ];

  const locationMetadata = createLocationMetadata(
    "Bellville",
    "Cape Town",
    "Northern Suburbs",
    "Professional cleaning services for Bellville homes and businesses. Serving this bustling Northern Suburbs hub with quality cleaning solutions.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/bellville', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function BellvillePage() {
  return (
    <SuburbPageTemplate
      suburb="Bellville"
      city="Cape Town"
      area="Northern Suburbs"
      description="Professional cleaning services for Bellville homes and businesses. Serving this bustling Northern Suburbs hub with quality cleaning solutions."
      available={true}
      highlights={[
        "Office & commercial cleaning",
        "Residential home cleaning",
        "Medical facility cleaning",
        "Regular maintenance programs",
        "Competitive business rates",
        "Reliable local team"
      ]}
    />
  );
}

