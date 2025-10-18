import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Constantia | Shalean",
  description: "Luxury cleaning services in Constantia, Cape Town. Professional cleaners for estates and homes in the winelands.",
};

export default function ConstantiaPage() {
  return (
    <SuburbPageTemplate
      suburb="Constantia"
      city="Cape Town"
      area="Southern Suburbs"
      description="Premium cleaning services for Constantia estates and homes. Experienced with luxury properties in Cape Town's prestigious wine valley."
      available={true}
      highlights={[
        "Luxury estate cleaning",
        "Large property specialists",
        "Wine cellar & entertainment area cleaning",
        "Staff accommodation cleaning",
        "Experienced with high-end homes",
        "Discretion & professionalism guaranteed"
      ]}
    />
  );
}

