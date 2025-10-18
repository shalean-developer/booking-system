import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Brackenfell | Shalean",
  description: "Professional cleaning services in Brackenfell, Cape Town. Trusted cleaners for Northern Suburbs families.",
};

export default function BrackenfellPage() {
  return (
    <SuburbPageTemplate
      suburb="Brackenfell"
      city="Cape Town"
      area="Northern Suburbs"
      description="Professional cleaning services for Brackenfell families. Reliable, friendly service for Northern Suburbs homes."
      available={true}
    />
  );
}

