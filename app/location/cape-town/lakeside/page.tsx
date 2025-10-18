import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Lakeside | Shalean",
  description: "Quality cleaning services in Lakeside, Cape Town. Professional cleaners for False Bay homes.",
};

export default function LakesidePage() {
  return (
    <SuburbPageTemplate
      suburb="Lakeside"
      city="Cape Town"
      area="False Bay"
      description="Quality cleaning services in Lakeside. Professional care for False Bay family homes."
      available={true}
    />
  );
}

