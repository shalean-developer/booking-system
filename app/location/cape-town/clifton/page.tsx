import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Clifton | Shalean",
  description: "Luxury cleaning services in Clifton, Cape Town. Premium cleaners for beachfront properties on the Atlantic Seaboard.",
};

export default function CliftonPage() {
  return (
    <SuburbPageTemplate
      suburb="Clifton"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Premium cleaning services for Clifton's exclusive beachfront properties. Specialized in luxury homes and holiday rentals along Cape Town's most prestigious beaches."
      available={true}
    />
  );
}

