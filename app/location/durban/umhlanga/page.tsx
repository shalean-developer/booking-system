import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Umhlanga",
    "Durban", 
    "Coastal North",
    "Professional cleaning services in Umhlanga, Durban. Coastal property cleaning specialists with flexible scheduling. Book your trusted cleaner today!",
    [
      "Coastal property specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function UmhlangaPage() {
  return (
    <SuburbPageTemplate
      suburb="Umhlanga"
      city="Durban"
      area="Coastal North"
      description="Professional cleaning services in Umhlanga, Durban. Perfect for coastal properties and apartments in this beautiful Northern coastal area. Reliable, trustworthy cleaning services."
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
