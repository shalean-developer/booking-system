import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Tokai | Shalean",
  description: "Professional cleaning services in Tokai, Cape Town. Quality cleaners for Southern Suburbs properties.",
};

export default function TokaiPage() {
  return (
    <SuburbPageTemplate
      suburb="Tokai"
      city="Cape Town"
      area="Southern Suburbs"
      description="Professional cleaning services in Tokai. Quality care for your Southern Suburbs home near the forest."
      available={true}
    />
  );
}

