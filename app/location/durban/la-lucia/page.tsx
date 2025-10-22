import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "La Lucia",
    "Durban", 
    "Coastal North",
    "Professional cleaning services in La Lucia, Durban. Coastal property cleaning specialists. Book same-day service in Coastal North.",
    [
      "Coastal property specialists",
      "Luxury home cleaning",
      "Flexible scheduling",
      "Same-day service"
    ]
  );
}

export default function LaLuciaPage() {
  return (
    <SuburbPageTemplate
      suburb="La Lucia"
      city="Durban"
      area="Coastal North"
      description="Professional cleaning services in La Lucia, Durban. Perfect for coastal properties in this upmarket Northern coastal area."
      highlights={[
        "Coastal property specialists",
        "Luxury home expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
