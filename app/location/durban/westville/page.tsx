import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Westville",
    "Durban", 
    "Western Suburbs",
    "Professional cleaning services in Westville, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Western Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function WestvillePage() {
  return (
    <SuburbPageTemplate
      suburb="Westville"
      city="Durban"
      area="Western Suburbs"
      description="Professional cleaning services in Westville, Durban. From family homes to properties in this established Western Suburbs area."
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
