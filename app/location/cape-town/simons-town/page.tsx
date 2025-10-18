import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Simon's Town | Shalean",
  description: "Professional cleaning services in Simon's Town, Cape Town. Naval town and coastal property specialists.",
};

export default function SimonsTownPage() {
  return (
    <SuburbPageTemplate
      suburb="Simon's Town"
      city="Cape Town"
      area="False Bay"
      description="Professional cleaning services in historic Simon's Town. Expert care for naval homes and coastal properties."
      available={true}
    />
  );
}

