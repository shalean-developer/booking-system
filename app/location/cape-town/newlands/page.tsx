import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Student accommodation cleaning",
    "Family home specialists",
    "Rental property turnover",
    "Garden cottage cleaning",
    "Flexible scheduling options",
    "Experienced & reliable team"
  ];

  const locationMetadata = createLocationMetadata(
    "Newlands",
    "Cape Town",
    "Southern Suburbs",
    "Quality cleaning services in leafy Newlands. Perfect for family homes, student accommodation, and rental properties in this popular suburb.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/newlands', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function NewlandsPage() {
  return (
    <SuburbPageTemplate
      suburb="Newlands"
      city="Cape Town"
      area="Southern Suburbs"
      description="Quality cleaning services in leafy Newlands. Perfect for family homes, student accommodation, and rental properties in this popular suburb."
      available={true}
      highlights={[
        "Student accommodation cleaning",
        "Family home specialists",
        "Rental property turnover",
        "Garden cottage cleaning",
        "Flexible scheduling options",
        "Experienced & reliable team"
      ]}
    />
  );
}

