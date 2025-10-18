import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Tamboerskloof | Shalean",
  description: "Quality cleaning services in Tamboerskloof, Cape Town. Trusted cleaners for City Bowl homes.",
};

export default function TamboerskloofPage() {
  return (
    <SuburbPageTemplate
      suburb="Tamboerskloof"
      city="Cape Town"
      area="City Bowl"
      description="Quality cleaning services for Tamboerskloof's beautiful homes and apartments. Professional care in the heart of the City Bowl."
      available={true}
    />
  );
}

