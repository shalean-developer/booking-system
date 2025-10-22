import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Southern Suburbs Cleaning Services | Shalean",
  description: "Professional cleaning services in Durban's Southern Suburbs including Bluff, Wentworth, Montclair, and Chatsworth. Book today!",
  canonical: "/location/durban/southern-suburbs",
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-durban-southern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Durban Southern Suburbs"
  }
});

export default function SouthernSuburbsPage() {
  const suburbs = [
    { name: "Bluff", slug: "bluff", available: true },
    { name: "Wentworth", slug: "wentworth", available: true },
    { name: "Montclair", slug: "montclair", available: true },
    { name: "Chatsworth", slug: "chatsworth", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Southern Suburbs"
      city="Durban"
      description="Professional cleaning services across Durban's Southern Suburbs. From coastal properties in Bluff to family homes in Chatsworth, we provide reliable cleaning services for this diverse area."
      suburbs={suburbs}
      highlights={[
        "Coastal property specialists",
        "Family home expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
