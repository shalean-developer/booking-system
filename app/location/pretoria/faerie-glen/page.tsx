import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Faerie Glen",
    "Pretoria", 
    "Eastern Suburbs",
    "Professional cleaning services in Faerie Glen, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service today!",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function FaerieGlenPage() {
  return (
    <SuburbPageTemplate
      suburb="Faerie Glen"
      city="Pretoria"
      area="Eastern Suburbs"
      description="Professional cleaning services in Faerie Glen, Pretoria. From family homes to golf estate properties, we provide reliable cleaning services."
      highlights={[
        "Home cleaning specialists",
        "Golf estate expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
