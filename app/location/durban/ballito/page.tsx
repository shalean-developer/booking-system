import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Ballito",
    "Durban", 
    "Coastal North",
    "Professional cleaning services in Ballito, Durban. Coastal home cleaning specialists with flexible scheduling. Book your trusted cleaner today!",
    [
      "Coastal home specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function BallitoPage() {
  return (
    <SuburbPageTemplate
      suburb="Ballito"
      city="Durban"
      area="Coastal North"
      description="Professional cleaning services in Ballito, Durban. Perfect for coastal homes and holiday properties in this beautiful Northern coastal area. Reliable, trustworthy cleaning services."
      highlights={[
        "Coastal home specialists",
        "Holiday property expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
