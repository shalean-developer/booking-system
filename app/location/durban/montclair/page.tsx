import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Montclair",
    "Durban", 
    "Southern Suburbs",
    "Professional cleaning services in Montclair, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Southern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function MontclairPage() {
  return (
    <SuburbPageTemplate
      suburb="Montclair"
      city="Durban"
      area="Southern Suburbs"
      description="Professional cleaning services in Montclair, Durban. From family homes to properties in this Southern Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Suburban property expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
