import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Exclusive residential cleaning",
    "Luxury property specialists",
    "High-end apartment maintenance",
    "Discretion & privacy guaranteed",
    "Premium cleaning products",
    "Flexible scheduling available"
  ];

  const locationMetadata = createLocationMetadata(
    "Fresnaye",
    "Cape Town",
    "Atlantic Seaboard",
    "High-end cleaning services for Fresnaye's luxury homes. Discretion, professionalism, and exceptional quality guaranteed.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/fresnaye', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function FresnayePage() {
  return (
    <SuburbPageTemplate
      suburb="Fresnaye"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="High-end cleaning services for Fresnaye's luxury homes. Discretion, professionalism, and exceptional quality guaranteed."
      available={true}
    />
  );
}

