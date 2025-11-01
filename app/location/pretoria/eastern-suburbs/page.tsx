import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Eastern Suburbs Cleaning Services | Shalean",
  description: "Professional cleaning services in Pretoria's Eastern Suburbs including Menlyn, Lynnwood, Brooklyn, Waterkloof, Garsfontein, Faerie Glen, and Moreleta Park. Book today!",
  canonical: generateCanonical("/location/pretoria/eastern-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-pretoria-eastern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Pretoria Eastern Suburbs"
  }
});

export default function EasternSuburbsPage() {
  const suburbs = [
    { name: "Menlyn", slug: "menlyn", available: true },
    { name: "Lynnwood", slug: "lynnwood", available: true },
    { name: "Brooklyn", slug: "brooklyn", available: true },
    { name: "Waterkloof", slug: "waterkloof", available: true },
    { name: "Garsfontein", slug: "garsfontein", available: true },
    { name: "Faerie Glen", slug: "faerie-glen", available: true },
    { name: "Moreleta Park", slug: "moreleta-park", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Eastern Suburbs"
      city="Pretoria"
      description="Professional cleaning services across Pretoria's prestigious Eastern Suburbs. From luxury homes in Waterkloof to family properties in Garsfontein, we provide exceptional cleaning services for this upmarket area."
      suburbs={suburbs}
      highlights={[
        "Luxury home specialists",
        "Golf estate expertise",
        "Flexible scheduling",
        "Premium cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
