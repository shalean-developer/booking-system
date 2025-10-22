import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Montana",
    "Pretoria", 
    "Northern Suburbs",
    "Professional cleaning services in Montana, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service in the Northern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function MontanaPage() {
  return (
    <SuburbPageTemplate
      suburb="Montana"
      city="Pretoria"
      area="Northern Suburbs"
      description="Professional cleaning services in Montana, Pretoria. From family homes to apartments, we provide reliable cleaning services for this Northern Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Family-friendly service",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
