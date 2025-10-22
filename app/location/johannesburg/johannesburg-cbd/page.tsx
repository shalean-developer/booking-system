import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Johannesburg CBD",
    "Johannesburg",
    "Inner City",
    "Professional cleaning services in Johannesburg CBD. Expert cleaners for offices, apartments, and commercial spaces in the city center.",
    [
      "CBD specialists",
      "Office cleaning experts",
      "Commercial cleaning",
      "Flexible scheduling"
    ]
  );
}

export default function JohannesburgCBDPage() {
  return (
    <SuburbPageTemplate
      suburb="Johannesburg CBD"
      city="Johannesburg"
      area="Inner City"
      description="Professional cleaning services in Johannesburg CBD, the heart of the city. From corporate offices to apartments, we provide specialized cleaning for this bustling urban environment."
      highlights={[
        "CBD specialists",
        "Office cleaning experts",
        "Commercial cleaning services",
        "Flexible scheduling",
        "Same-day service available",
        "Urban area expertise"
      ]}
      available={true}
    />
  );
}
