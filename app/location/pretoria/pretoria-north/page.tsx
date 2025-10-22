import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Pretoria North",
    "Pretoria", 
    "Northern Suburbs",
    "Professional cleaning services in Pretoria North. Reliable home cleaning with experienced cleaners. Book same-day service in the Northern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function PretoriaNorthPage() {
  return (
    <SuburbPageTemplate
      suburb="Pretoria North"
      city="Pretoria"
      area="Northern Suburbs"
      description="Professional cleaning services in Pretoria North. From family homes to suburban properties, we provide reliable cleaning services for this Northern area."
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
