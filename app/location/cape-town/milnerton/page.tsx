import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Milnerton | Shalean",
  description: "Professional cleaning services in Milnerton, Cape Town. Trusted cleaners for Northern Suburbs homes.",
};

export default function MilnertonPage() {
  return (
    <SuburbPageTemplate
      suburb="Milnerton"
      city="Cape Town"
      area="Northern Suburbs"
      description="Professional cleaning services for Milnerton homes and apartments. Quality service for Northern Suburbs residents."
      available={true}
    />
  );
}

