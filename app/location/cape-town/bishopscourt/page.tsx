import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Bishopscourt | Shalean",
  description: "Luxury cleaning services in Bishopscourt, Cape Town. Premium cleaners for prestigious estates.",
};

export default function BishopscourtPage() {
  return (
    <SuburbPageTemplate
      suburb="Bishopscourt"
      city="Cape Town"
      area="Southern Suburbs"
      description="Luxury cleaning services for Bishopscourt's prestigious estates. Discretion and excellence in Cape Town's most exclusive suburb."
      available={true}
    />
  );
}

