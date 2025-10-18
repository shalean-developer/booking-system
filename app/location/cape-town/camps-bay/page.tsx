import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning Services in Camps Bay | Shalean",
  description: "Professional cleaning services in Camps Bay, Cape Town. Book your trusted cleaner today! Serving the Atlantic Seaboard.",
};

export default function CampsBayPage() {
  return (
    <SuburbPageTemplate
      suburb="Camps Bay"
      city="Cape Town"
      area="Atlantic Seaboard"
      description="Professional cleaning services for your Camps Bay home or apartment. Trusted by locals and property managers in one of Cape Town's most prestigious coastal suburbs."
      available={true}
      highlights={[
        "Experienced with luxury properties",
        "Airbnb & holiday rental specialists",
        "Ocean view apartment cleaning",
        "Same-day service available",
        "Eco-friendly products available",
        "Fully insured and vetted cleaners"
      ]}
    />
  );
}

