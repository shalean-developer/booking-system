import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Family home cleaning specialists",
    "Deep cleaning services",
    "Office cleaning available",
    "Regular weekly or bi-weekly service",
    "Child & pet-safe products",
    "Trusted local cleaners"
  ];

  const locationMetadata = createLocationMetadata(
    "Claremont",
    "Cape Town",
    "Southern Suburbs",
    "Professional cleaning services for Claremont residents. Serving families and businesses in Cape Town's vibrant Southern Suburbs.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/claremont', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function ClaremontPage() {
  return (
    <SuburbPageTemplate
      suburb="Claremont"
      city="Cape Town"
      area="Southern Suburbs"
      description="Professional cleaning services for Claremont residents. Serving families and businesses in Cape Town's vibrant Southern Suburbs."
      available={true}
      highlights={[
        "Family home cleaning specialists",
        "Deep cleaning services",
        "Office cleaning available",
        "Regular weekly or bi-weekly service",
        "Child & pet-safe products",
        "Trusted local cleaners"
      ]}
    />
  );
}

