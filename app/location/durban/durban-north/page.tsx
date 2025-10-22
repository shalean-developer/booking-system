import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Durban North",
    "Durban", 
    "Coastal North",
    "Professional cleaning services in Durban North. Reliable home cleaning with experienced cleaners. Book same-day service in Coastal North.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function DurbanNorthPage() {
  return (
    <SuburbPageTemplate
      suburb="Durban North"
      city="Durban"
      area="Coastal North"
      description="Professional cleaning services in Durban North. From family homes to apartments in this established Northern area."
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
