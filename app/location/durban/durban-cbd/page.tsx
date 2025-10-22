import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Durban CBD",
    "Durban", 
    "Upper Areas",
    "Professional cleaning services in Durban CBD. Office and apartment cleaning specialists. Book same-day service in Upper Areas.",
    [
      "Office cleaning specialists",
      "Apartment cleaning",
      "Flexible scheduling",
      "Same-day service"
    ]
  );
}

export default function DurbanCBDPage() {
  return (
    <SuburbPageTemplate
      suburb="Durban CBD"
      city="Durban"
      area="Upper Areas"
      description="Professional cleaning services in Durban's CBD. From corporate offices to city apartments, we provide comprehensive cleaning services for the heart of Durban."
      highlights={[
        "Office cleaning specialists",
        "Apartment cleaning expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "After-hours cleaning"
      ]}
      available={true}
    />
  );
}
