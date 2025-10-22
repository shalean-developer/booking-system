import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Lynnwood",
    "Pretoria", 
    "Eastern Suburbs",
    "Professional cleaning services in Lynnwood, Pretoria. Reliable home and apartment cleaning with experienced cleaners. Book same-day service in the Eastern Suburbs.",
    [
      "Home cleaning specialists",
      "Apartment cleaning",
      "Flexible scheduling",
      "Same-day service"
    ]
  );
}

export default function LynnwoodPage() {
  return (
    <SuburbPageTemplate
      suburb="Lynnwood"
      city="Pretoria"
      area="Eastern Suburbs"
      description="Professional cleaning services in Lynnwood, Pretoria. From family homes to apartments, we provide reliable cleaning services for this upmarket Eastern Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Apartment cleaning expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
