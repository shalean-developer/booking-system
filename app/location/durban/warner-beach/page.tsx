import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Warner Beach",
    "Durban", 
    "South Coast",
    "Professional cleaning services in Warner Beach, Durban. Beach house cleaning specialists. Book same-day service in South Coast.",
    [
      "Beach house specialists",
      "Holiday home cleaning",
      "Flexible scheduling",
      "Same-day service"
    ]
  );
}

export default function WarnerBeachPage() {
  return (
    <SuburbPageTemplate
      suburb="Warner Beach"
      city="Durban"
      area="South Coast"
      description="Professional cleaning services in Warner Beach, Durban. Perfect for beach houses and holiday homes in this South Coast area."
      highlights={[
        "Beach house specialists",
        "Holiday home expertise",
        "Flexible scheduling",
        "Salt air cleaning expertise",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
