import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Arcadia",
    "Pretoria", 
    "Central",
    "Professional cleaning services in Arcadia, Pretoria. Reliable apartment and home cleaning with experienced cleaners. Book same-day service today!",
    [
      "Apartment specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function ArcadiaPage() {
  return (
    <SuburbPageTemplate
      suburb="Arcadia"
      city="Pretoria"
      area="Central"
      description="Professional cleaning services in Arcadia, Pretoria. From apartments to historic homes, we provide reliable cleaning services for this central neighborhood."
      highlights={[
        "Apartment cleaning specialists",
        "Historic property expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
