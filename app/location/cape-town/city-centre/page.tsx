import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "High-rise apartment cleaning",
    "Corporate office cleaning",
    "Retail space cleaning",
    "After-hours service available",
    "Security-cleared staff",
    "Quick response times"
  ];

  const locationMetadata = createLocationMetadata(
    "City Centre",
    "Cape Town",
    "City Bowl",
    "Expert cleaning services for Cape Town's CBD. From high-rise apartments to corporate offices, we deliver exceptional cleaning in the city center.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/city-centre', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function CityCentrePage() {
  return (
    <SuburbPageTemplate
      suburb="City Centre"
      city="Cape Town"
      area="City Bowl"
      description="Expert cleaning services for Cape Town's CBD. From high-rise apartments to corporate offices, we deliver exceptional cleaning in the city center."
      available={true}
      highlights={[
        "High-rise apartment cleaning",
        "Corporate office cleaning",
        "Retail space cleaning",
        "After-hours service available",
        "Security-cleared staff",
        "Quick response times"
      ]}
    />
  );
}

