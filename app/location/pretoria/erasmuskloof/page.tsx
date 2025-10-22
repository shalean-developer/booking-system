import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Erasmuskloof",
    "Pretoria", 
    "Southern Suburbs",
    "Professional cleaning services in Erasmuskloof, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service today!",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function ErasmuskloofPage() {
  return (
    <SuburbPageTemplate
      suburb="Erasmuskloof"
      city="Pretoria"
      area="Southern Suburbs"
      description="Professional cleaning services in Erasmuskloof, Pretoria. From family homes to properties in this Southern Suburbs area."
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
