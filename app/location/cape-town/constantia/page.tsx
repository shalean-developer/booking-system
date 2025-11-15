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
    "Premium cleaning services in Constantia, Cape Town. Luxury estate cleaning for high-end homes. Wine cellar & entertainment area specialists. Same-day available. Book trusted cleaners serving Constantia today!",
    highlights,
    {
      keywords: [
        "cleaning services Constantia",
        "Constantia cleaners",
        "luxury cleaning Constantia",
        "estate cleaning Constantia",
        "house cleaning Constantia Cape Town",
        "professional cleaners Constantia"
      ],
      services: ["Luxury Cleaning", "Deep Cleaning", "Estate Cleaning", "Move In/Out"],
      propertyTypes: ["Luxury Estates", "Large Properties", "Wine Estates"]
    }
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
      description="Premium cleaning services in Constantia, Cape Town. Luxury estate cleaning for high-end homes in Cape Town's prestigious wine valley. Wine cellar & entertainment area specialists. Serving Constantia with vetted, professional cleaners. Book your Constantia cleaning service today!"
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

