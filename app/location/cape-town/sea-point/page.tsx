import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Sea Point | Shalean",
  description: "Professional cleaning services in Sea Point, Cape Town. Reliable cleaners for apartments and homes along the Atlantic Seaboard.",
};

export default function SeaPointPage() {
  return (
    <SuburbPageTemplate
      suburb="Sea Point"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Reliable cleaning services for Sea Point residents. From high-rise apartments to family homes, we provide professional cleaning tailored to your needs."
      available={true}
      highlights={[
        "High-rise apartment specialists",
        "Regular & one-time cleaning",
        "Airbnb property cleaning",
        "Flexible scheduling 7 days a week",
        "Vetted & background-checked cleaners",
        "100% satisfaction guarantee"
      ]}
    />
  );
}

