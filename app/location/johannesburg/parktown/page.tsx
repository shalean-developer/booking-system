import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Parktown",
    "Johannesburg",
    "Inner City",
    "Professional cleaning services in Parktown, Johannesburg. Expert cleaners for historic homes and offices in this prestigious inner city area.",
    [
      "Historic area specialists",
      "Office cleaning",
      "Heritage home cleaning",
      "Flexible scheduling"
    ]
  );
}

export default function ParktownPage() {
  return (
    <SuburbPageTemplate
      suburb="Parktown"
      city="Johannesburg"
      area="Inner City"
      description="Professional cleaning services in Parktown, Johannesburg's prestigious inner city area. From historic homes to modern offices, we provide specialized cleaning for this heritage-rich community."
      highlights={[
        "Historic area specialists",
        "Office cleaning services",
        "Heritage home cleaning",
        "Flexible scheduling",
        "Same-day service available",
        "Historic area expertise"
      ]}
      available={true}
    />
  );
}
