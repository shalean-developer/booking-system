import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Sunnyside",
    "Pretoria", 
    "Central",
    "Professional cleaning services in Sunnyside, Pretoria. Reliable apartment cleaning with experienced cleaners. Book same-day service today!",
    [
      "Apartment specialists",
      "Student accommodation",
      "Flexible scheduling",
      "Affordable rates"
    ]
  );
}

export default function SunnysidePage() {
  return (
    <SuburbPageTemplate
      suburb="Sunnyside"
      city="Pretoria"
      area="Central"
      description="Professional cleaning services in Sunnyside, Pretoria. Perfect for apartments and student accommodation in this vibrant central area."
      highlights={[
        "Apartment cleaning specialists",
        "Student accommodation expertise",
        "Flexible scheduling",
        "Affordable rates",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
