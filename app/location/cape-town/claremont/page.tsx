import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Claremont | Shalean",
  description: "Professional cleaning services in Claremont, Cape Town. Trusted cleaners for Southern Suburbs homes and businesses.",
};

export default function ClaremontPage() {
  return (
    <SuburbPageTemplate
      suburb="Claremont"
      city="Cape Town"
      area="Southern Suburbs"
      description="Professional cleaning services for Claremont residents. Serving families and businesses in Cape Town's vibrant Southern Suburbs."
      available={true}
      highlights={[
        "Family home cleaning specialists",
        "Deep cleaning services",
        "Office cleaning available",
        "Regular weekly or bi-weekly service",
        "Child & pet-safe products",
        "Trusted local cleaners"
      ]}
    />
  );
}

