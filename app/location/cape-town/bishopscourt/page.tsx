import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Luxury estate cleaning",
    "Large property specialists",
    "Wine cellar & entertainment area cleaning",
    "Staff accommodation cleaning",
    "Experienced with high-end homes",
    "Discretion & professionalism guaranteed"
  ];

  const locationMetadata = createLocationMetadata(
    "Bishopscourt",
    "Cape Town",
    "Southern Suburbs",
    "Luxury cleaning services for Bishopscourt's prestigious estates. Discretion and excellence in Cape Town's most exclusive suburb.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/bishopscourt', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function BishopscourtPage() {
  return (
    <SuburbPageTemplate
      suburb="Bishopscourt"
      city="Cape Town"
      area="Southern Suburbs"
      description="Luxury cleaning services for Bishopscourt's prestigious estates. Discretion and excellence in Cape Town's most exclusive suburb."
      available={true}
    />
  );
}

