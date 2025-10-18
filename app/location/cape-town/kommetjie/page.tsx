import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Kommetjie | Shalean",
  description: "Coastal cleaning services in Kommetjie, Cape Town. Beach property and holiday home specialists.",
};

export default function KommetjiePage() {
  return (
    <SuburbPageTemplate
      suburb="Kommetjie"
      city="Cape Town"
      area="West Coast"
      description="Coastal cleaning services in Kommetjie. Perfect for beach cottages and holiday homes by the lighthouse."
      available={true}
    />
  );
}

