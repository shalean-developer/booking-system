import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Bloubergstrand | Shalean",
  description: "Reliable cleaning services in Bloubergstrand, Cape Town. Beach property and holiday home specialists.",
};

export default function BloubergstrandPage() {
  return (
    <SuburbPageTemplate
      suburb="Bloubergstrand"
      city="Cape Town"
      area="Northern Suburbs"
      description="Reliable cleaning for Bloubergstrand's beachfront properties. Perfect for holiday homes and permanent residences along the west coast."
      available={true}
    />
  );
}

