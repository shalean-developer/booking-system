import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Strand | Shalean",
  description: "Affordable cleaning services in Strand, Cape Town. Reliable cleaners for Helderberg properties.",
};

export default function StrandPage() {
  return (
    <SuburbPageTemplate
      suburb="Strand"
      city="Cape Town"
      area="Helderberg"
      description="Affordable cleaning services in Strand. Reliable service for Helderberg beachfront and residential properties."
      available={true}
    />
  );
}

