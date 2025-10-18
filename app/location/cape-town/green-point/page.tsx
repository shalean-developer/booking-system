import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Green Point | Shalean",
  description: "Top-rated cleaning services in Green Point, Cape Town. Professional cleaners for apartments, homes, and offices.",
};

export default function GreenPointPage() {
  return (
    <SuburbPageTemplate
      suburb="Green Point"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Expert cleaning services in Green Point. Whether you're near the V&A Waterfront or Green Point Common, we deliver exceptional cleaning services."
      available={true}
      highlights={[
        "Urban apartment cleaning specialists",
        "Office & commercial cleaning",
        "Post-event cleaning services",
        "Weekend availability",
        "Professional & punctual staff",
        "Competitive flat-rate pricing"
      ]}
    />
  );
}

