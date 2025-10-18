import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Durbanville | Shalean",
  description: "Quality cleaning services in Durbanville, Cape Town. Professional cleaners for Northern Suburbs estates and homes.",
};

export default function DurbanvillePage() {
  return (
    <SuburbPageTemplate
      suburb="Durbanville"
      city="Cape Town"
      area="Northern Suburbs"
      description="Quality cleaning services for Durbanville's estates and family homes. Professional service in Cape Town's wine country."
      available={true}
    />
  );
}

