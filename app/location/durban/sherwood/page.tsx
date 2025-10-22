import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Sherwood",
    "Durban", 
    "Upper Areas",
    "Professional cleaning services in Sherwood, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Upper Areas.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function SherwoodPage() {
  return (
    <SuburbPageTemplate
      suburb="Sherwood"
      city="Durban"
      area="Upper Areas"
      description="Professional cleaning services in Sherwood, Durban. From family homes to properties in this Upper Areas region."
      highlights={[
        "Home cleaning specialists",
        "Suburban property expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
