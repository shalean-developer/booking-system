import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Bryanston",
    "Johannesburg",
    "Northern Suburbs",
    "Professional cleaning services in Bryanston, Johannesburg. Luxury cleaning for upmarket homes and offices in this prestigious Northern Suburbs area.",
    [
      "Luxury home specialists",
      "Executive office cleaning",
      "Premium services",
      "Flexible scheduling"
    ]
  );
}

export default function BryanstonPage() {
  return (
    <SuburbPageTemplate
      suburb="Bryanston"
      city="Johannesburg"
      area="Northern Suburbs"
      description="Professional cleaning services in Bryanston, Johannesburg's prestigious Northern Suburbs area. From luxury homes to executive offices, we provide premium cleaning services for this upmarket community."
      highlights={[
        "Luxury home specialists",
        "Executive office cleaning",
        "Premium cleaning services",
        "Flexible scheduling",
        "Same-day service available",
        "High-end area expertise"
      ]}
      available={true}
    />
  );
}
