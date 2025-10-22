import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Garsfontein",
    "Pretoria", 
    "Eastern Suburbs",
    "Professional cleaning services in Garsfontein, Pretoria. Family home cleaning specialists. Book same-day service in the Eastern Suburbs.",
    [
      "Family home specialists",
      "Child-safe products",
      "Flexible scheduling",
      "Regular maintenance"
    ]
  );
}

export default function GarsfonteinPage() {
  return (
    <SuburbPageTemplate
      suburb="Garsfontein"
      city="Pretoria"
      area="Eastern Suburbs"
      description="Professional cleaning services in Garsfontein, Pretoria. Perfect for family homes in this growing Eastern Suburbs area."
      highlights={[
        "Family home specialists",
        "Child-safe cleaning products",
        "Flexible scheduling for families",
        "Eco-friendly products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
