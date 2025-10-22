import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Menlyn",
    "Pretoria", 
    "Eastern Suburbs",
    "Professional cleaning services in Menlyn, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service in the Eastern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function MenlynPage() {
  return (
    <SuburbPageTemplate
      suburb="Menlyn"
      city="Pretoria"
      area="Eastern Suburbs"
      description="Professional cleaning services in Menlyn, Pretoria. From family homes to apartments, we provide reliable cleaning services for this established Eastern Suburbs area."
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
