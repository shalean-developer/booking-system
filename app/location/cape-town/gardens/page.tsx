import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Historic property specialists",
    "Victorian home cleaning",
    "Modern apartment services",
    "Art & antique-safe cleaning",
    "Trusted & insured team",
    "Attention to detail guaranteed"
  ];

  const locationMetadata = createLocationMetadata(
    "Gardens",
    "Cape Town",
    "City Bowl",
    "Quality cleaning services for Gardens' beautiful homes and apartments. Experience meets care in this historic Cape Town suburb.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/gardens', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function GardensPage() {
  return (
    <SuburbPageTemplate
      suburb="Gardens"
      city="Cape Town"
      area="City Bowl"
      description="Quality cleaning services for Gardens' beautiful homes and apartments. Experience meets care in this historic Cape Town suburb."
      available={true}
      highlights={[
        "Historic property specialists",
        "Victorian home cleaning",
        "Modern apartment services",
        "Art & antique-safe cleaning",
        "Trusted & insured team",
        "Attention to detail guaranteed"
      ]}
    />
  );
}

