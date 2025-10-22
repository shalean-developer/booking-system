import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Glenwood",
    "Durban", 
    "Upper Areas",
    "Professional cleaning services in Glenwood, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Upper Areas.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function GlenwoodPage() {
  return (
    <SuburbPageTemplate
      suburb="Glenwood"
      city="Durban"
      area="Upper Areas"
      description="Professional cleaning services in Glenwood, Durban. From family homes to properties in this Upper Areas region."
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
