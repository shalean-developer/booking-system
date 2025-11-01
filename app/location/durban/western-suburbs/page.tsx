import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Western Suburbs Cleaning Services | Shalean",
  description: "Professional cleaning services in Durban's Western Suburbs including Westville, Hillcrest, Kloof, Pinetown, and Queensburgh. Book today!",
  canonical: generateCanonical("/location/durban/western-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-durban-western-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Durban Western Suburbs"
  }
});

export default function WesternSuburbsPage() {
  const suburbs = [
    { name: "Westville", slug: "westville", available: true },
    { name: "Hillcrest", slug: "hillcrest", available: true },
    { name: "Kloof", slug: "kloof", available: true },
    { name: "Pinetown", slug: "pinetown", available: true },
    { name: "Queensburgh", slug: "queensburgh", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Western Suburbs"
      city="Durban"
      description="Professional cleaning services across Durban's Western Suburbs. From family homes to established neighborhoods, we provide reliable cleaning services for this suburban area."
      suburbs={suburbs}
      highlights={[
        "Home cleaning specialists",
        "Established suburb expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
