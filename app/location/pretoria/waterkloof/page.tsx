import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Waterkloof",
    "Pretoria", 
    "Eastern Suburbs",
    "Professional cleaning services in Waterkloof, Pretoria. Luxury home cleaning specialists with experienced cleaners. Book same-day service today!",
    [
      "Luxury home specialists",
      "Premium cleaning",
      "Flexible scheduling",
      "Discreet service"
    ]
  );
}

export default function WaterkloofPage() {
  return (
    <SuburbPageTemplate
      suburb="Waterkloof"
      city="Pretoria"
      area="Eastern Suburbs"
      description="Professional cleaning services in Waterkloof, Pretoria. Specializing in luxury homes and estates in this prestigious Eastern Suburbs area."
      highlights={[
        "Luxury home specialists",
        "Premium cleaning products",
        "Flexible scheduling",
        "Discreet, professional service",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
