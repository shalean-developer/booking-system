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
    "Constantia",
    "Cape Town",
    "Southern Suburbs",
    "Premium cleaning services for Constantia estates and homes. Experienced with luxury properties in Cape Town's prestigious wine valley.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/constantia', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function ConstantiaPage() {
  return (
    <SuburbPageTemplate
      suburb="Constantia"
      city="Cape Town"
      area="Southern Suburbs"
      description="Premium cleaning services for Constantia estates and homes. Experienced with luxury properties in Cape Town's prestigious wine valley."
      available={true}
      highlights={[
        "Luxury estate cleaning",
        "Large property specialists",
        "Wine cellar & entertainment area cleaning",
        "Staff accommodation cleaning",
        "Experienced with high-end homes",
        "Discretion & professionalism guaranteed"
      ]}
    />
  );
}

