import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Student-friendly rates",
    "Shared house cleaning",
    "Flexible payment options",
    "Quick booking process",
    "Same-week availability",
    "Trustworthy & reliable staff"
  ];

  const locationMetadata = createLocationMetadata(
    "Observatory",
    "Cape Town",
    "City Bowl",
    "Affordable, quality cleaning services for Observatory's vibrant community. Ideal for student digs, shared houses, and small apartments.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/observatory', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function ObservatoryPage() {
  return (
    <SuburbPageTemplate
      suburb="Observatory"
      city="Cape Town"
      area="City Bowl"
      description="Affordable, quality cleaning services for Observatory's vibrant community. Ideal for student digs, shared houses, and small apartments."
      available={true}
      highlights={[
        "Student-friendly rates",
        "Shared house cleaning",
        "Flexible payment options",
        "Quick booking process",
        "Same-week availability",
        "Trustworthy & reliable staff"
      ]}
    />
  );
}

