import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Scarborough | Shalean",
  description: "Professional cleaning services in Scarborough, Cape Town. Remote beach property specialists.",
};

export default function ScarboroughPage() {
  return (
    <SuburbPageTemplate
      suburb="Scarborough"
      city="Cape Town"
      area="West Coast"
      description="Professional cleaning services for Scarborough's remote beach properties. Quality care at the end of the peninsula."
      available={true}
    />
  );
}

