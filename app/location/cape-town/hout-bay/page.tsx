import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Holiday home specialists",
    "Mountain & harbor properties",
    "Regular & one-time cleaning",
    "Post-renovation cleaning",
    "Airbnb turnover service",
    "Experienced local team"
  ];

  const locationMetadata = createLocationMetadata(
    "Hout Bay",
    "Cape Town",
    "West Coast",
    "Expert cleaning services for beautiful Hout Bay. From harbor-side apartments to mountainside homes, we've got you covered.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/hout-bay', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function HoutBayPage() {
  return (
    <SuburbPageTemplate
      suburb="Hout Bay"
      city="Cape Town"
      area="West Coast"
      description="Expert cleaning services for beautiful Hout Bay. From harbor-side apartments to mountainside homes, we've got you covered."
      available={true}
      highlights={[
        "Holiday home specialists",
        "Mountain & harbor properties",
        "Regular & one-time cleaning",
        "Post-renovation cleaning",
        "Airbnb turnover service",
        "Experienced local team"
      ]}
    />
  );
}

