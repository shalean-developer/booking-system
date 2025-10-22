import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Loft & industrial space cleaning",
    "Studio apartment specialists",
    "Commercial studio cleaning",
    "Regular & deep cleaning options",
    "Evening appointments available",
    "Urban living experts"
  ];

  const locationMetadata = createLocationMetadata(
    "Woodstock",
    "Cape Town",
    "City Bowl",
    "Modern cleaning services for Woodstock's trendy lofts and apartments. Perfect for creative professionals and urban dwellers.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/woodstock', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function WoodstockPage() {
  return (
    <SuburbPageTemplate
      suburb="Woodstock"
      city="Cape Town"
      area="City Bowl"
      description="Modern cleaning services for Woodstock's trendy lofts and apartments. Perfect for creative professionals and urban dwellers."
      available={true}
      highlights={[
        "Loft & industrial space cleaning",
        "Studio apartment specialists",
        "Commercial studio cleaning",
        "Regular & deep cleaning options",
        "Evening appointments available",
        "Urban living experts"
      ]}
    />
  );
}

