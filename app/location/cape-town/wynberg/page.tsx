import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Wynberg | Shalean",
  description: "Reliable cleaning services in Wynberg, Cape Town. Professional cleaners for Southern Suburbs homes.",
};

export default function WynbergPage() {
  return (
    <SuburbPageTemplate
      suburb="Wynberg"
      city="Cape Town"
      area="Southern Suburbs"
      description="Reliable cleaning services in Wynberg. Professional care for Southern Suburbs homes and businesses."
      available={true}
    />
  );
}

