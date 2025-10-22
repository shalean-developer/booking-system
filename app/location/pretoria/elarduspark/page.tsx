import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Elarduspark",
    "Pretoria", 
    "Southern Suburbs",
    "Professional cleaning services in Elarduspark, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service in the Southern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function ElardusparkPage() {
  return (
    <SuburbPageTemplate
      suburb="Elarduspark"
      city="Pretoria"
      area="Southern Suburbs"
      description="Professional cleaning services in Elarduspark, Pretoria. From family homes to properties in this Southern Suburbs area."
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
