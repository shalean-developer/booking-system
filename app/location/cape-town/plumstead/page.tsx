import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Plumstead | Shalean",
  description: "Professional cleaning services in Plumstead, Cape Town. Affordable cleaners for Southern Suburbs families.",
};

export default function PlumsteadPage() {
  return (
    <SuburbPageTemplate
      suburb="Plumstead"
      city="Cape Town"
      area="Southern Suburbs"
      description="Professional cleaning services in Plumstead. Affordable, quality service for Southern Suburbs families."
      available={true}
    />
  );
}

