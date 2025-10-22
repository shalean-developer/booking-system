import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Apartment complex specialists",
    "Townhouse cleaning",
    "Regular maintenance cleaning",
    "Deep cleaning services",
    "Pet-friendly cleaning products",
    "Affordable rates"
  ];

  const locationMetadata = createLocationMetadata(
    "Table View",
    "Cape Town",
    "Northern Suburbs",
    "Professional cleaning services for Table View residents. Serving apartments, townhouses, and family homes in this coastal suburb.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/table-view', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function TableViewPage() {
  return (
    <SuburbPageTemplate
      suburb="Table View"
      city="Cape Town"
      area="Northern Suburbs"
      description="Professional cleaning services for Table View residents. Serving apartments, townhouses, and family homes in this coastal suburb."
      available={true}
      highlights={[
        "Apartment complex specialists",
        "Townhouse cleaning",
        "Regular maintenance cleaning",
        "Deep cleaning services",
        "Pet-friendly cleaning products",
        "Affordable rates"
      ]}
    />
  );
}

