import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Heuwelsig",
    "Pretoria", 
    "Western Suburbs",
    "Professional cleaning services in Heuwelsig, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service in the Western Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function HeuwelsigPage() {
  return (
    <SuburbPageTemplate
      suburb="Heuwelsig"
      city="Pretoria"
      area="Western Suburbs"
      description="Professional cleaning services in Heuwelsig, Pretoria. From family homes to properties in this Western Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Family-friendly service",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
