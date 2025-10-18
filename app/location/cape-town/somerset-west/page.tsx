import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Somerset West | Shalean",
  description: "Quality cleaning services in Somerset West, Cape Town. Professional cleaners for Helderberg homes.",
};

export default function SomersetWestPage() {
  return (
    <SuburbPageTemplate
      suburb="Somerset West"
      city="Cape Town"
      area="Helderberg"
      description="Quality cleaning services in Somerset West. Professional care for Helderberg estates and family homes."
      available={true}
    />
  );
}

