import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Fourways",
    "Johannesburg", 
    "Northern Suburbs",
    "Professional cleaning services in Fourways, Johannesburg. Family home cleaning specialists with flexible scheduling. Book your trusted cleaner today!",
    [
      "Family home specialists",
      "Flexible scheduling",
      "Child-safe products",
      "Regular maintenance"
    ]
  );
}

export default function FourwaysPage() {
  return (
    <SuburbPageTemplate
      suburb="Fourways"
      city="Johannesburg"
      area="Northern Suburbs"
      description="Professional cleaning services in Fourways, Johannesburg. Perfect for family homes and apartments in this growing Northern Suburbs area. Reliable, trustworthy cleaning services."
      highlights={[
        "Family home specialists",
        "Child-safe cleaning products",
        "Flexible scheduling for families",
        "Regular maintenance programs",
        "Same-day service available",
        "Move-in/out cleaning"
      ]}
      available={true}
    />
  );
}
