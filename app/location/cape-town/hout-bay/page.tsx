import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Hout Bay | Shalean",
  description: "Professional cleaning services in Hout Bay, Cape Town. Trusted cleaners for homes and holiday properties.",
};

export default function HoutBayPage() {
  return (
    <SuburbPageTemplate
      suburb="Hout Bay"
      city="Cape Town"
      area="West Coast"
      description="Expert cleaning services for beautiful Hout Bay. From harbor-side apartments to mountainside homes, we've got you covered."
      available={true}
      highlights={[
        "Holiday home specialists",
        "Mountain & harbor properties",
        "Regular & one-time cleaning",
        "Post-renovation cleaning",
        "Airbnb turnover service",
        "Experienced local team"
      ]}
    />
  );
}

