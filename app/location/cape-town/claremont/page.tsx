import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "Family home cleaning specialists",
    "Deep cleaning services",
    "Office cleaning available",
    "Regular weekly or bi-weekly service",
    "Child & pet-safe products",
    "Trusted local cleaners"
  ];

  const locationMetadata = createLocationMetadata(
    "Claremont",
    "Cape Town",
    "Southern Suburbs",
    "Professional cleaning services in Claremont, Cape Town. Trusted cleaners for family homes, offices, and apartments. Same-day available. From R250. Book vetted cleaners serving Claremont and Southern Suburbs today!",
    highlights,
    {
      keywords: [
        "cleaning services Claremont",
        "Claremont cleaners",
        "house cleaning Claremont",
        "office cleaning Claremont",
        "deep cleaning Claremont Cape Town",
        "professional cleaners Claremont"
      ],
      services: ["Regular Cleaning", "Deep Cleaning", "Office Cleaning", "Move In/Out"],
      propertyTypes: ["Family Homes", "Offices", "Apartments"]
    }
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/claremont', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function ClaremontPage() {
  return (
    <SuburbPageTemplate
      suburb="Claremont"
      city="Cape Town"
      area="Southern Suburbs"
      description="Professional cleaning services in Claremont, Cape Town. Trusted cleaners for family homes, offices, and apartments in the Southern Suburbs. Same-day available. Serving Claremont with vetted, insured cleaners. Book your Claremont cleaning service today!"
      available={true}
      highlights={[
        "Family home cleaning specialists",
        "Deep cleaning services",
        "Office cleaning available",
        "Regular weekly or bi-weekly service",
        "Child & pet-safe products",
        "Trusted local cleaners"
      ]}
    />
  );
}

