import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Gardens | Shalean",
  description: "Premium cleaning services in Gardens, Cape Town. Trusted cleaners for historic homes and modern apartments.",
};

export default function GardensPage() {
  return (
    <SuburbPageTemplate
      suburb="Gardens"
      city="Cape Town"
      area="City Bowl"
      description="Quality cleaning services for Gardens' beautiful homes and apartments. Experience meets care in this historic Cape Town suburb."
      available={true}
      highlights={[
        "Historic property specialists",
        "Victorian home cleaning",
        "Modern apartment services",
        "Art & antique-safe cleaning",
        "Trusted & insured team",
        "Attention to detail guaranteed"
      ]}
    />
  );
}

