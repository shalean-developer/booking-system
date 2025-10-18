import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Kenilworth | Shalean",
  description: "Quality cleaning services in Kenilworth, Cape Town. Trusted cleaners for Southern Suburbs properties.",
};

export default function KenilworthPage() {
  return (
    <SuburbPageTemplate
      suburb="Kenilworth"
      city="Cape Town"
      area="Southern Suburbs"
      description="Quality cleaning services in Kenilworth. Professional service for Southern Suburbs homes and offices."
      available={true}
    />
  );
}

