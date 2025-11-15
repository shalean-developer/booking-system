import { SuburbPageTemplate } from "@/components/suburb-page-template";
import { createLocationMetadata, createMetadata, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const highlights = [
    "High-rise apartment specialists",
    "Regular & one-time cleaning",
    "Airbnb property cleaning",
    "Flexible scheduling 7 days a week",
    "Vetted & background-checked cleaners",
    "100% satisfaction guarantee"
  ];

  const locationMetadata = createLocationMetadata(
    "Sea Point",
    "Cape Town",
    "Atlantic Seaboard",
    "Professional cleaning services in Sea Point, Cape Town. Trusted cleaners for apartments, homes, and Airbnb properties. Same-day available. From R250. Book vetted cleaners serving Sea Point today!",
    highlights,
    {
      keywords: [
        "cleaning services Sea Point",
        "Sea Point cleaners",
        "apartment cleaning Sea Point",
        "Airbnb cleaning Sea Point",
        "house cleaning Sea Point Cape Town",
        "professional cleaners Sea Point"
      ],
      services: ["Regular Cleaning", "Deep Cleaning", "Airbnb Cleaning", "Move In/Out"],
      propertyTypes: ["Apartments", "Family Homes", "Airbnb Properties"]
    }
  );

  // Validate metadata
  const validation = validateMetadata(locationMetadata);
  logMetadataValidation('/location/cape-town/sea-point', locationMetadata, validation);

  return createMetadata(locationMetadata);
}

export default function SeaPointPage() {
  return (
    <SuburbPageTemplate
      suburb="Sea Point"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Professional cleaning services in Sea Point, Cape Town. Trusted cleaners for high-rise apartments, family homes, and Airbnb properties. Same-day available. Serving Sea Point with vetted, insured cleaners. Book your Sea Point cleaning service today!"
      available={true}
      highlights={[
        "High-rise apartment specialists",
        "Regular & one-time cleaning",
        "Airbnb property cleaning",
        "Flexible scheduling 7 days a week",
        "Vetted & background-checked cleaners",
        "100% satisfaction guarantee"
      ]}
    />
  );
}

