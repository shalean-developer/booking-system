import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Braamfontein",
    "Johannesburg",
    "Inner City",
    "Professional cleaning services in Braamfontein, Johannesburg. Expert cleaners for student accommodation, offices, and apartments in this vibrant area.",
    [
      "Student accommodation specialists",
      "Office cleaning experts",
      "Apartment cleaning",
      "Flexible scheduling"
    ]
  );
}

export default function BraamfonteinPage() {
  return (
    <SuburbPageTemplate
      suburb="Braamfontein"
      city="Johannesburg"
      area="Inner City"
      description="Professional cleaning services in Braamfontein, Johannesburg's vibrant inner city area. From student accommodation to corporate offices, we provide specialized cleaning for this dynamic urban environment."
      highlights={[
        "Student accommodation specialists",
        "Office cleaning experts",
        "Apartment cleaning services",
        "Flexible scheduling",
        "Same-day service available",
        "Urban area expertise"
      ]}
      available={true}
    />
  );
}
