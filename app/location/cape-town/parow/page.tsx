import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Parow | Shalean",
  description: "Affordable cleaning services in Parow, Cape Town. Reliable cleaners for Northern Suburbs homes.",
};

export default function ParowPage() {
  return (
    <SuburbPageTemplate
      suburb="Parow"
      city="Cape Town"
      area="Northern Suburbs"
      description="Affordable, reliable cleaning services in Parow. Quality home cleaning at competitive rates."
      available={true}
    />
  );
}

