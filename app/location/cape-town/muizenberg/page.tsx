import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Muizenberg | Shalean",
  description: "Professional cleaning services in Muizenberg, Cape Town. Beachfront property and holiday home cleaning specialists.",
};

export default function MuizenbergPage() {
  return (
    <SuburbPageTemplate
      suburb="Muizenberg"
      city="Cape Town"
      area="False Bay"
      description="Cleaning services for Muizenberg's beachfront properties and homes. Perfect for holiday rentals, surfer pads, and family beach houses."
      available={true}
      highlights={[
        "Holiday rental cleaning",
        "Beach house specialists",
        "Sand & salt damage prevention",
        "Quick turnaround times",
        "Weekend & holiday availability",
        "Lock-up & key-holding service available"
      ]}
    />
  );
}

