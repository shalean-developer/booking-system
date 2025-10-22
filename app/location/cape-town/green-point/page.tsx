import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Urban apartment cleaning specialists",
    "Office & commercial cleaning",
    "Post-event cleaning services",
    "Weekend availability",
    "Professional & punctual staff",
    "Competitive flat-rate pricing"
  ];

  const locationMetadata = createLocationMetadata(
    "Green Point",
    "Cape Town",
    "Atlantic Seaboard",
    "Expert cleaning services in Green Point. Whether you're near the V&A Waterfront or Green Point Common, we deliver exceptional cleaning services.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/green-point', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function GreenPointPage() {
  return (
    <SuburbPageTemplate
      suburb="Green Point"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Expert cleaning services in Green Point. Whether you're near the V&A Waterfront or Green Point Common, we deliver exceptional cleaning services."
      available={true}
      highlights={[
        "Urban apartment cleaning specialists",
        "Office & commercial cleaning",
        "Post-event cleaning services",
        "Weekend availability",
        "Professional & punctual staff",
        "Competitive flat-rate pricing"
      ]}
    />
  );
}

