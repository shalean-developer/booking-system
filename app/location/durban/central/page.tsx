import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Central Durban Cleaning Services | Shalean",
  description: "Professional cleaning services in Central Durban including Morningside, Berea, Musgrave, Greyville, and Windermere. Book today!",
  canonical: "/location/durban/central",
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-durban-central-1200x630.jpg",
    alt: "Professional cleaning services in Central Durban"
  }
});

export default function CentralPage() {
  const suburbs = [
    { name: "Morningside", slug: "morningside", available: true },
    { name: "Berea", slug: "berea", available: true },
    { name: "Musgrave", slug: "musgrave", available: true },
    { name: "Greyville", slug: "greyville", available: true },
    { name: "Windermere", slug: "windermere", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Central"
      city="Durban"
      description="Professional cleaning services across Central Durban. From family homes to apartments in established neighborhoods, we provide reliable cleaning services for this central region."
      suburbs={suburbs}
      highlights={[
        "Home cleaning specialists",
        "Apartment expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
