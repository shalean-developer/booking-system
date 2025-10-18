import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Bantry Bay | Shalean",
  description: "Professional cleaning services in Bantry Bay, Cape Town. Trusted cleaners for luxury apartments and homes.",
};

export default function BantryBayPage() {
  return (
    <SuburbPageTemplate
      suburb="Bantry Bay"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Professional cleaning for Bantry Bay's luxury apartments and penthouses. Expert care for high-end properties with ocean views."
      available={true}
    />
  );
}

