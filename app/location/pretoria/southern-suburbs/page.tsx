import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Southern Suburbs Cleaning Services | Shalean",
  description: "Professional cleaning services in Pretoria's Southern Suburbs including Groenkloof, Erasmuskloof, Elarduspark, and Irene. Book today!",
  canonical: generateCanonical("/location/pretoria/southern-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-pretoria-southern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Pretoria Southern Suburbs"
  }
});

export default function SouthernSuburbsPage() {
  const suburbs = [
    { name: "Groenkloof", slug: "groenkloof", available: true },
    { name: "Erasmuskloof", slug: "erasmuskloof", available: true },
    { name: "Elarduspark", slug: "elarduspark", available: true },
    { name: "Irene", slug: "irene", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Southern Suburbs"
      city="Pretoria"
      description="Professional cleaning services across Pretoria's Southern Suburbs. From established neighborhoods to smallholdings, we provide reliable cleaning services for diverse properties."
      suburbs={suburbs}
      highlights={[
        "Home cleaning specialists",
        "Smallholding expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
