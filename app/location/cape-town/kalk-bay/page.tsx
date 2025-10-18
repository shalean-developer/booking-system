import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Kalk Bay | Shalean",
  description: "Charming cleaning services in Kalk Bay, Cape Town. Professional cleaners for historic coastal homes.",
};

export default function KalkBayPage() {
  return (
    <SuburbPageTemplate
      suburb="Kalk Bay"
      city="Cape Town"
      area="False Bay"
      description="Charming cleaning services for Kalk Bay's unique coastal homes. Care for historic properties and beach cottages."
      available={true}
    />
  );
}

