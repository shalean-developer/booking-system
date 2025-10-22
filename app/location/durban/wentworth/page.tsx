import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Wentworth",
    "Durban", 
    "Southern Suburbs",
    "Professional cleaning services in Wentworth, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Southern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function WentworthPage() {
  return (
    <SuburbPageTemplate
      suburb="Wentworth"
      city="Durban"
      area="Southern Suburbs"
      description="Professional cleaning services in Wentworth, Durban. From family homes to properties in this Southern Suburbs area."
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
