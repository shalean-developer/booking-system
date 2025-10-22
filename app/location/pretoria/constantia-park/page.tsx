import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Constantia Park",
    "Pretoria", 
    "Western Suburbs",
    "Professional cleaning services in Constantia Park, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service in the Western Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function ConstantiaParkPage() {
  return (
    <SuburbPageTemplate
      suburb="Constantia Park"
      city="Pretoria"
      area="Western Suburbs"
      description="Professional cleaning services in Constantia Park, Pretoria. From family homes to properties in this Western Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Family home expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
