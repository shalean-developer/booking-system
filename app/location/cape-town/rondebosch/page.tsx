import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Student accommodation specialists",
    "Academic facility cleaning",
    "Large home cleaning services",
    "Move-in/out cleaning",
    "Same-week availability",
    "Quality guaranteed service"
  ];

  const locationMetadata = createLocationMetadata(
    "Rondebosch",
    "Cape Town",
    "Southern Suburbs",
    "Expert cleaning services for Rondebosch homes and businesses. Serving the UCT area and surrounding residential neighborhoods.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/rondebosch', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function RondeboschPage() {
  return (
    <SuburbPageTemplate
      suburb="Rondebosch"
      city="Cape Town"
      area="Southern Suburbs"
      description="Expert cleaning services for Rondebosch homes and businesses. Serving the UCT area and surrounding residential neighborhoods."
      available={true}
      highlights={[
        "Student accommodation specialists",
        "Academic facility cleaning",
        "Large home cleaning services",
        "Move-in/out cleaning",
        "Same-week availability",
        "Quality guaranteed service"
      ]}
    />
  );
}

