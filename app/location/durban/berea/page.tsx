import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Berea",
    "Durban", 
    "Central",
    "Professional cleaning services in Berea, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Central Durban.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function BereaPage() {
  return (
    <SuburbPageTemplate
      suburb="Berea"
      city="Durban"
      area="Central"
      description="Professional cleaning services in Berea, Durban. From family homes to properties in this established central area."
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
