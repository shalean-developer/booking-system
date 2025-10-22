import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Holiday rental cleaning",
    "Beach house specialists",
    "Sand & salt damage prevention",
    "Quick turnaround times",
    "Weekend & holiday availability",
    "Lock-up & key-holding service available"
  ];

  const locationMetadata = createLocationMetadata(
    "Muizenberg",
    "Cape Town",
    "False Bay",
    "Cleaning services for Muizenberg's beachfront properties and homes. Perfect for holiday rentals, surfer pads, and family beach houses.",
    highlights
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/muizenberg', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function MuizenbergPage() {
  return (
    <SuburbPageTemplate
      suburb="Muizenberg"
      city="Cape Town"
      area="False Bay"
      description="Cleaning services for Muizenberg's beachfront properties and homes. Perfect for holiday rentals, surfer pads, and family beach houses."
      available={true}
      highlights={[
        "Holiday rental cleaning",
        "Beach house specialists",
        "Sand & salt damage prevention",
        "Quick turnaround times",
        "Weekend & holiday availability",
        "Lock-up & key-holding service available"
      ]}
    />
  );
}

