import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "High-rise apartment specialists",
    "Regular & one-time cleaning",
    "Airbnb property cleaning",
    "Flexible scheduling 7 days a week",
    "Vetted & background-checked cleaners",
    "100% satisfaction guarantee"
  ];

  const locationMetadata = createLocationMetadata(
    "Sea Point",
    "Cape Town",
    "Atlantic Seaboard",
    "Reliable cleaning services for Sea Point residents. From high-rise apartments to family homes, we provide professional cleaning tailored to your needs.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/sea-point', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function SeaPointPage() {
  return (
    <SuburbPageTemplate
      suburb="Sea Point"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Reliable cleaning services for Sea Point residents. From high-rise apartments to family homes, we provide professional cleaning tailored to your needs."
      available={true}
      highlights={[
        "High-rise apartment specialists",
        "Regular & one-time cleaning",
        "Airbnb property cleaning",
        "Flexible scheduling 7 days a week",
        "Vetted & background-checked cleaners",
        "100% satisfaction guarantee"
      ]}
    />
  );
}

