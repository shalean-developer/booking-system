import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Brooklyn",
    "Pretoria", 
    "Eastern Suburbs",
    "Professional cleaning services in Brooklyn, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service in the Eastern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function BrooklynPage() {
  return (
    <SuburbPageTemplate
      suburb="Brooklyn"
      city="Pretoria"
      area="Eastern Suburbs"
      description="Professional cleaning services in Brooklyn, Pretoria. From family homes to townhouses, we provide reliable cleaning services for this established Eastern Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Townhouse expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
