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
    "Bantry Bay",
    "Cape Town",
    "Atlantic Seaboard",
    "Professional cleaning for Bantry Bay's luxury apartments and penthouses. Expert care for high-end properties with ocean views.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/bantry-bay', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function BantryBayPage() {
  return (
    <SuburbPageTemplate
      suburb="Bantry Bay"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Professional cleaning for Bantry Bay's luxury apartments and penthouses. Expert care for high-end properties with ocean views."
      available={true}
    />
  );
}

