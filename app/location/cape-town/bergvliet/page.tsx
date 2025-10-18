import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Bergvliet | Shalean",
  description: "Reliable cleaning services in Bergvliet, Cape Town. Trusted cleaners for Southern Suburbs homes.",
};

export default function BergvlietPage() {
  return (
    <SuburbPageTemplate
      suburb="Bergvliet"
      city="Cape Town"
      area="Southern Suburbs"
      description="Reliable cleaning services in Bergvliet. Professional care for Southern Suburbs family homes."
      available={true}
    />
  );
}

