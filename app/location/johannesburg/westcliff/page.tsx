import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Westcliff",
    "Johannesburg",
    "Inner City",
    "Professional cleaning services in Westcliff, Johannesburg. Expert cleaners for luxury homes and apartments in this prestigious inner city area.",
    [
      "Luxury home specialists",
      "Apartment cleaning",
      "Premium services",
      "Flexible scheduling"
    ]
  );
}

export default function WestcliffPage() {
  return (
    <SuburbPageTemplate
      suburb="Westcliff"
      city="Johannesburg"
      area="Inner City"
      description="Professional cleaning services in Westcliff, Johannesburg's prestigious inner city area. From luxury homes to apartments, we provide premium cleaning services for this upmarket community."
      highlights={[
        "Luxury home specialists",
        "Apartment cleaning services",
        "Premium cleaning services",
        "Flexible scheduling",
        "Same-day service available",
        "High-end area expertise"
      ]}
      available={true}
    />
  );
}
