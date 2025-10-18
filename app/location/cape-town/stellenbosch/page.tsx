import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Stellenbosch | Shalean",
  description: "Professional cleaning services in Stellenbosch, Cape Town. Wine estate and student accommodation specialists.",
};

export default function StellenboschPage() {
  return (
    <SuburbPageTemplate
      suburb="Stellenbosch"
      city="Cape Town"
      area="Winelands"
      description="Professional cleaning services in Stellenbosch. Serving wine estates, student accommodation, and family homes in the heart of the Winelands."
      available={true}
    />
  );
}

