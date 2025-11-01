import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Rosebank",
    "Johannesburg", 
    "Northern Suburbs",
    "Professional cleaning services in Rosebank, Johannesburg. Reliable home and apartment cleaning with experienced cleaners. Book same-day service available.",
    [
      "Apartment cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function RosebankPage() {
  return (
    <SuburbPageTemplate
      suburb="Rosebank"
      city="Johannesburg"
      area="Northern Suburbs"
      description="Professional cleaning services in Rosebank, Johannesburg. From modern apartments to family homes, we provide reliable cleaning services for this vibrant Northern Suburbs area."
      highlights={[
        "Apartment cleaning specialists",
        "Modern home expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
