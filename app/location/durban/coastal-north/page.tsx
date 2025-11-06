import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Coastal North Cleaning Services | Shalean Professional Cleaning Services — Expert Home and Apartment Cleaning Services in Durban's Coastal North Including Umhlanga, Ballito, La Lucia, Durban North, and Umdloti",
  description: "Professional cleaning services in Durban's Coastal North including Umhlanga, Ballito, La Lucia, Durban North, and Umdloti. Book today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/durban/coastal-north"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-durban-coastal-north-1200x630.jpg",
    alt: "Professional cleaning services in Durban Coastal North"
  }
});

export default function CoastalNorthPage() {
  const suburbs = [
    { name: "Umhlanga", slug: "umhlanga", available: true },
    { name: "Ballito", slug: "ballito", available: true },
    { name: "La Lucia", slug: "la-lucia", available: true },
    { name: "Durban North", slug: "durban-north", available: true },
    { name: "Umdloti", slug: "umdloti", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Coastal North"
      city="Durban"
      description="Professional cleaning services across Durban's prestigious Coastal North. From luxury beach houses in Umhlanga to holiday homes in Ballito, we provide exceptional cleaning services for this coastal paradise."
      suburbs={suburbs}
      highlights={[
        "Beach house specialists",
        "Holiday home expertise",
        "Salt air cleaning expertise",
        "Flexible scheduling",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
