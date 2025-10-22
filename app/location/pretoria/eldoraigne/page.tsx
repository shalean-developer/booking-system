import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Eldoraigne",
    "Pretoria", 
    "Western Suburbs",
    "Professional cleaning services in Eldoraigne, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service today!",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function EldoraignePage() {
  return (
    <SuburbPageTemplate
      suburb="Eldoraigne"
      city="Pretoria"
      area="Western Suburbs"
      description="Professional cleaning services in Eldoraigne, Pretoria. From family homes to properties in this established Western Suburbs area."
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
