import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Hatfield",
    "Pretoria", 
    "Central",
    "Professional cleaning services in Hatfield, Pretoria. Student accommodation and apartment cleaning specialists. Book same-day service today!",
    [
      "Student accommodation",
      "Apartment specialists",
      "Flexible scheduling",
      "Affordable rates"
    ]
  );
}

export default function HatfieldPage() {
  return (
    <SuburbPageTemplate
      suburb="Hatfield"
      city="Pretoria"
      area="Central"
      description="Professional cleaning services in Hatfield, Pretoria. From student apartments to family homes, we provide reliable cleaning services for this university area."
      highlights={[
        "Student accommodation specialists",
        "Apartment cleaning expertise",
        "Flexible scheduling",
        "Affordable student rates",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
