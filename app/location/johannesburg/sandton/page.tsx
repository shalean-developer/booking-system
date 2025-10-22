import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Sandton",
    "Johannesburg", 
    "Northern Suburbs",
    "Professional cleaning services in Sandton, Johannesburg's premier business district. Experience luxury apartment and office cleaning with our trusted, vetted cleaners.",
    [
      "Luxury apartment specialists",
      "Office cleaning experts", 
      "Flexible scheduling",
      "Premium cleaning products"
    ]
  );
}

export default function SandtonPage() {
  return (
    <SuburbPageTemplate
      suburb="Sandton"
      city="Johannesburg"
      area="Northern Suburbs"
      description="Professional cleaning services in Sandton, Johannesburg's premier business and residential district. From luxury apartments to corporate offices, we provide exceptional cleaning services for this upmarket area."
      highlights={[
        "Luxury apartment specialists",
        "Office cleaning experts",
        "Flexible scheduling for professionals",
        "Premium cleaning products",
        "Same-day service available",
        "Strata-compliant cleaning"
      ]}
      available={true}
    />
  );
}
