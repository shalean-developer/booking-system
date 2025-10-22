import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Pinetown",
    "Durban", 
    "Western Suburbs",
    "Professional cleaning services in Pinetown, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Western Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function PinetownPage() {
  return (
    <SuburbPageTemplate
      suburb="Pinetown"
      city="Durban"
      area="Western Suburbs"
      description="Professional cleaning services in Pinetown, Durban. From family homes to properties in this established Western Suburbs area."
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
