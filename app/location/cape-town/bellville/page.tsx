import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Bellville | Shalean",
  description: "Reliable cleaning services in Bellville, Cape Town. Professional home and office cleaning in the Northern Suburbs.",
};

export default function BellvillePage() {
  return (
    <SuburbPageTemplate
      suburb="Bellville"
      city="Cape Town"
      area="Northern Suburbs"
      description="Professional cleaning services for Bellville homes and businesses. Serving this bustling Northern Suburbs hub with quality cleaning solutions."
      available={true}
      highlights={[
        "Office & commercial cleaning",
        "Residential home cleaning",
        "Medical facility cleaning",
        "Regular maintenance programs",
        "Competitive business rates",
        "Reliable local team"
      ]}
    />
  );
}

