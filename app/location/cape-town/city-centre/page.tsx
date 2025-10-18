import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Cape Town City Centre | Shalean",
  description: "Professional cleaning services in Cape Town CBD. Office and apartment cleaning in the heart of the city.",
};

export default function CityCentrePage() {
  return (
    <SuburbPageTemplate
      suburb="City Centre"
      city="Cape Town"
      area="City Bowl"
      description="Expert cleaning services for Cape Town's CBD. From high-rise apartments to corporate offices, we deliver exceptional cleaning in the city center."
      available={true}
      highlights={[
        "High-rise apartment cleaning",
        "Corporate office cleaning",
        "Retail space cleaning",
        "After-hours service available",
        "Security-cleared staff",
        "Quick response times"
      ]}
    />
  );
}

