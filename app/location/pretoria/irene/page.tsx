import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Irene",
    "Pretoria", 
    "Southern Suburbs",
    "Professional cleaning services in Irene, Pretoria. Reliable home and smallholding cleaning with experienced cleaners. Book same-day service today!",
    [
      "Home cleaning specialists",
      "Smallholding expertise",
      "Flexible scheduling",
      "Same-day service"
    ]
  );
}

export default function IrenePage() {
  return (
    <SuburbPageTemplate
      suburb="Irene"
      city="Pretoria"
      area="Southern Suburbs"
      description="Professional cleaning services in Irene, Pretoria. From family homes to smallholdings in this Southern Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Smallholding expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
