import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Houghton",
    "Johannesburg",
    "Inner City",
    "Professional cleaning services in Houghton, Johannesburg. Luxury cleaning for upmarket homes and offices in this prestigious inner city area.",
    [
      "Luxury home specialists",
      "Executive office cleaning",
      "Premium services",
      "Flexible scheduling"
    ]
  );
}

export default function HoughtonPage() {
  return (
    <SuburbPageTemplate
      suburb="Houghton"
      city="Johannesburg"
      area="Inner City"
      description="Professional cleaning services in Houghton, Johannesburg's prestigious inner city area. From luxury homes to executive offices, we provide premium cleaning services for this upmarket community."
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
