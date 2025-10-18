import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Noordhoek | Shalean",
  description: "Professional cleaning services in Noordhoek, Cape Town. Beach and farm property specialists.",
};

export default function NoordhoekPage() {
  return (
    <SuburbPageTemplate
      suburb="Noordhoek"
      city="Cape Town"
      area="West Coast"
      description="Professional cleaning services for Noordhoek's beach homes and farm properties. Quality care in this scenic coastal village."
      available={true}
    />
  );
}

