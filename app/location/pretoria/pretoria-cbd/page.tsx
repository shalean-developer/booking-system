import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Pretoria CBD",
    "Pretoria", 
    "Central",
    "Professional cleaning services in Pretoria CBD. Reliable office and apartment cleaning with experienced cleaners. Book same-day service in Central Pretoria.",
    [
      "Office cleaning specialists",
      "Apartment cleaning",
      "Flexible scheduling",
      "Same-day service"
    ]
  );
}

export default function PretoriaCBDPage() {
  return (
    <SuburbPageTemplate
      suburb="Pretoria CBD"
      city="Pretoria"
      area="Central"
      description="Professional cleaning services in Pretoria's CBD. From corporate offices to city apartments, we provide comprehensive cleaning services for the heart of Pretoria."
      highlights={[
        "Office cleaning specialists",
        "Apartment cleaning expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "After-hours cleaning"
      ]}
      available={true}
    />
  );
}
