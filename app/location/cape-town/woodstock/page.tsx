import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Woodstock | Shalean",
  description: "Professional cleaning services in Woodstock, Cape Town. Modern loft and apartment cleaning specialists.",
};

export default function WoodstockPage() {
  return (
    <SuburbPageTemplate
      suburb="Woodstock"
      city="Cape Town"
      area="City Bowl"
      description="Modern cleaning services for Woodstock's trendy lofts and apartments. Perfect for creative professionals and urban dwellers."
      available={true}
      highlights={[
        "Loft & industrial space cleaning",
        "Studio apartment specialists",
        "Commercial studio cleaning",
        "Regular & deep cleaning options",
        "Evening appointments available",
        "Urban living experts"
      ]}
    />
  );
}

