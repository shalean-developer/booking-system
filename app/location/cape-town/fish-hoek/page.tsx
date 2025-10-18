import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Fish Hoek | Shalean",
  description: "Professional cleaning services in Fish Hoek, Cape Town. Beach property and family home specialists.",
};

export default function FishHoekPage() {
  return (
    <SuburbPageTemplate
      suburb="Fish Hoek"
      city="Cape Town"
      area="False Bay"
      description="Professional cleaning services in Fish Hoek. Perfect for beachfront properties and family homes along False Bay."
      available={true}
    />
  );
}

