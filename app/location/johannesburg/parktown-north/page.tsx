import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Parktown North",
    "Johannesburg",
    "Inner City",
    "Professional cleaning services in Parktown North, Johannesburg. Expert cleaners for homes and offices in this established inner city area.",
    [
      "Inner city specialists",
      "Office cleaning",
      "Residential services",
      "Flexible scheduling"
    ]
  );
}

export default function ParktownNorthPage() {
  return (
    <SuburbPageTemplate
      suburb="Parktown North"
      city="Johannesburg"
      area="Inner City"
      description="Professional cleaning services in Parktown North, Johannesburg's established inner city area. From family homes to corporate offices, we provide comprehensive cleaning solutions."
      highlights={[
        "Inner city specialists",
        "Office cleaning services",
        "Residential cleaning",
        "Flexible scheduling",
        "Same-day service available",
        "Urban area expertise"
      ]}
      available={true}
    />
  );
}
