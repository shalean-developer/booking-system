import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Bluff",
    "Durban", 
    "Southern Suburbs",
    "Professional cleaning services in Bluff, Durban. Coastal property cleaning specialists. Book same-day service in Southern Suburbs.",
    [
      "Coastal property specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function BluffPage() {
  return (
    <SuburbPageTemplate
      suburb="Bluff"
      city="Durban"
      area="Southern Suburbs"
      description="Professional cleaning services in Bluff, Durban. Perfect for coastal properties in this Southern Suburbs area."
      highlights={[
        "Coastal property specialists",
        "Salt air cleaning expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
