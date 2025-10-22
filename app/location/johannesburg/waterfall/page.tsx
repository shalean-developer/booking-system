import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Waterfall",
    "Johannesburg",
    "Northern Suburbs",
    "Professional cleaning services in Waterfall, Johannesburg. Expert cleaners for luxury homes and apartments in this upmarket Northern Suburbs area.",
    [
      "Luxury home specialists",
      "Apartment cleaning",
      "Premium services",
      "Flexible scheduling"
    ]
  );
}

export default function WaterfallPage() {
  return (
    <SuburbPageTemplate
      suburb="Waterfall"
      city="Johannesburg"
      area="Northern Suburbs"
      description="Professional cleaning services in Waterfall, Johannesburg's upmarket Northern Suburbs area. From luxury homes to apartments, we provide premium cleaning services for this prestigious community."
      highlights={[
        "Luxury home specialists",
        "Apartment cleaning services",
        "Premium cleaning services",
        "Flexible scheduling",
        "Same-day service available",
        "High-end area expertise"
      ]}
      available={true}
    />
  );
}
