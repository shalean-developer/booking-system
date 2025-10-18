import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Newlands | Shalean",
  description: "Reliable cleaning services in Newlands, Cape Town. Professional home and office cleaning in the Southern Suburbs.",
};

export default function NewlandsPage() {
  return (
    <SuburbPageTemplate
      suburb="Newlands"
      city="Cape Town"
      area="Southern Suburbs"
      description="Quality cleaning services in leafy Newlands. Perfect for family homes, student accommodation, and rental properties in this popular suburb."
      available={true}
      highlights={[
        "Student accommodation cleaning",
        "Family home specialists",
        "Rental property turnover",
        "Garden cottage cleaning",
        "Flexible scheduling options",
        "Experienced & reliable team"
      ]}
    />
  );
}

