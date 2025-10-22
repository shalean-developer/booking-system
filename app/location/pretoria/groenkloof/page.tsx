import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Groenkloof",
    "Pretoria", 
    "Southern Suburbs",
    "Professional cleaning services in Groenkloof, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service in the Southern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function GroenkloofPage() {
  return (
    <SuburbPageTemplate
      suburb="Groenkloof"
      city="Pretoria"
      area="Southern Suburbs"
      description="Professional cleaning services in Groenkloof, Pretoria. From family homes to properties in this established Southern Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Established suburb expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
