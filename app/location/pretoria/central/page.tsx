import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Central Pretoria Cleaning Services | Shalean Professional Cleaning Services — Expert Home and Apartment Cleaning Services in Central Pretoria Including Centurion, Pretoria CBD, Arcadia, Sunnyside, and Hatfield",
  description: "Professional cleaning services in Central Pretoria including Centurion, Pretoria CBD, Arcadia, Sunnyside, and Hatfield. Book today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/pretoria/central"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-pretoria-central-1200x630.jpg",
    alt: "Professional cleaning services in Central Pretoria"
  }
});

export default function CentralPage() {
  const suburbs = [
    { name: "Centurion", slug: "centurion", available: true },
    { name: "Pretoria CBD", slug: "pretoria-cbd", available: true },
    { name: "Arcadia", slug: "arcadia", available: true },
    { name: "Sunnyside", slug: "sunnyside", available: true },
    { name: "Hatfield", slug: "hatfield", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Central"
      city="Pretoria"
      description="Professional cleaning services across Central Pretoria. From the business hub of Centurion to the student areas of Hatfield, we provide comprehensive cleaning services for this central region."
      suburbs={suburbs}
      highlights={[
        "Office and home specialists",
        "Student accommodation expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "After-hours cleaning"
      ]}
      available={true}
    />
  );
}
