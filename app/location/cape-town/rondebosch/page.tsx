import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Rondebosch | Shalean",
  description: "Professional cleaning services in Rondebosch, Cape Town. Home and office cleaning near UCT and Rondebosch Common.",
};

export default function RondeboschPage() {
  return (
    <SuburbPageTemplate
      suburb="Rondebosch"
      city="Cape Town"
      area="Southern Suburbs"
      description="Expert cleaning services for Rondebosch homes and businesses. Serving the UCT area and surrounding residential neighborhoods."
      available={true}
      highlights={[
        "Student accommodation specialists",
        "Academic facility cleaning",
        "Large home cleaning services",
        "Move-in/out cleaning",
        "Same-week availability",
        "Quality guaranteed service"
      ]}
    />
  );
}

