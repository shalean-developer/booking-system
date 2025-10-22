import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "South Coast Cleaning Services | Shalean",
  description: "Professional cleaning services in Durban's South Coast including Amanzimtoti, Umkomaas, and Warner Beach. Beach house specialists. Book today!",
  canonical: "/location/durban/south-coast",
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-durban-south-coast-1200x630.jpg",
    alt: "Professional cleaning services in Durban South Coast"
  }
});

export default function SouthCoastPage() {
  const suburbs = [
    { name: "Amanzimtoti", slug: "amanzimtoti", available: true },
    { name: "Umkomaas", slug: "umkomaas", available: true },
    { name: "Warner Beach", slug: "warner-beach", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="South Coast"
      city="Durban"
      description="Professional cleaning services across Durban's South Coast. Specializing in beach houses and holiday homes with expertise in salt air cleaning and coastal property maintenance."
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
