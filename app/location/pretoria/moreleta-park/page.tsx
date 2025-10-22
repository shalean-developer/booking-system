import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Moreleta Park",
    "Pretoria", 
    "Eastern Suburbs",
    "Professional cleaning services in Moreleta Park, Pretoria. Family home cleaning specialists. Book same-day service in the Eastern Suburbs.",
    [
      "Family home specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Regular maintenance"
    ]
  );
}

export default function MoreletaParkPage() {
  return (
    <SuburbPageTemplate
      suburb="Moreleta Park"
      city="Pretoria"
      area="Eastern Suburbs"
      description="Professional cleaning services in Moreleta Park, Pretoria. Perfect for family homes in this established Eastern Suburbs area."
      highlights={[
        "Family home specialists",
        "Suburban home expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
