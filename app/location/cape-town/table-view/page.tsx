import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Table View | Shalean",
  description: "Reliable cleaning services in Table View, Cape Town. Professional home and apartment cleaning in the Northern Suburbs.",
};

export default function TableViewPage() {
  return (
    <SuburbPageTemplate
      suburb="Table View"
      city="Cape Town"
      area="Northern Suburbs"
      description="Professional cleaning services for Table View residents. Serving apartments, townhouses, and family homes in this coastal suburb."
      available={true}
      highlights={[
        "Apartment complex specialists",
        "Townhouse cleaning",
        "Regular maintenance cleaning",
        "Deep cleaning services",
        "Pet-friendly cleaning products",
        "Affordable rates"
      ]}
    />
  );
}

