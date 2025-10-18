import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Oranjezicht | Shalean",
  description: "Professional cleaning services in Oranjezicht, Cape Town. Expert cleaners for City Bowl properties.",
};

export default function OranjezichtPage() {
  return (
    <SuburbPageTemplate
      suburb="Oranjezicht"
      city="Cape Town"
      area="City Bowl"
      description="Professional cleaning services in Oranjezicht. Expert care for your City Bowl home with mountain views."
      available={true}
    />
  );
}

