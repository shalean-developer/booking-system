import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Centurion",
    "Pretoria", 
    "Central",
    "Professional cleaning services in Centurion, Pretoria. Reliable home and office cleaning with experienced cleaners. Book same-day service in Centurion.",
    [
      "Home and office specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function CenturionPage() {
  return (
    <SuburbPageTemplate
      suburb="Centurion"
      city="Pretoria"
      area="Central"
      description="Professional cleaning services in Centurion, Pretoria. From residential homes to corporate offices, we provide comprehensive cleaning services for this central location."
      highlights={[
        "Home and office specialists",
        "Central location expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
