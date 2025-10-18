import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Observatory | Shalean",
  description: "Affordable cleaning services in Observatory, Cape Town. Perfect for students, artists, and young professionals.",
};

export default function ObservatoryPage() {
  return (
    <SuburbPageTemplate
      suburb="Observatory"
      city="Cape Town"
      area="City Bowl"
      description="Affordable, quality cleaning services for Observatory's vibrant community. Ideal for student digs, shared houses, and small apartments."
      available={true}
      highlights={[
        "Student-friendly rates",
        "Shared house cleaning",
        "Flexible payment options",
        "Quick booking process",
        "Same-week availability",
        "Trustworthy & reliable staff"
      ]}
    />
  );
}

