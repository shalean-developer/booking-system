import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Fresnaye | Shalean",
  description: "High-end cleaning services in Fresnaye, Cape Town. Professional cleaners for luxury homes.",
};

export default function FresnayePage() {
  return (
    <SuburbPageTemplate
      suburb="Fresnaye"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="High-end cleaning services for Fresnaye's luxury homes. Discretion, professionalism, and exceptional quality guaranteed."
      available={true}
    />
  );
}

