import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Morningside",
    "Durban", 
    "Central",
    "Professional cleaning services in Morningside, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Central Durban.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function MorningsidePage() {
  return (
    <SuburbPageTemplate
      suburb="Morningside"
      city="Durban"
      area="Central"
      description="Professional cleaning services in Morningside, Durban. From family homes to apartments in this central Durban area."
      highlights={[
        "Home cleaning specialists",
        "Apartment expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
