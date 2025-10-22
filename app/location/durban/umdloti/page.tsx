import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Umdloti",
    "Durban", 
    "Coastal North",
    "Professional cleaning services in Umdloti, Durban. Beach house cleaning specialists. Book same-day service in Coastal North.",
    [
      "Beach house specialists",
      "Holiday home cleaning",
      "Flexible scheduling",
      "Same-day service"
    ]
  );
}

export default function UmdlotiPage() {
  return (
    <SuburbPageTemplate
      suburb="Umdloti"
      city="Durban"
      area="Coastal North"
      description="Professional cleaning services in Umdloti, Durban. Perfect for beach houses and holiday homes in this coastal paradise."
      highlights={[
        "Beach house specialists",
        "Holiday home expertise",
        "Flexible scheduling",
        "Salt air cleaning expertise",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
