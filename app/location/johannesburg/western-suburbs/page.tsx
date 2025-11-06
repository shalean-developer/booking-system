import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Western Suburbs Cleaning Services | Shalean",
  description: "Professional cleaning services in Johannesburg's Western Suburbs including Roodepoort, Florida, and Honeydew. Expert cleaners available for regular maintenance, deep cleaning, and move-in/out services.",
  canonical: generateCanonical("/location/johannesburg/western-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-johannesburg-western-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Johannesburg Western Suburbs"
  }
});

export default function WesternSuburbsPage() {
  const suburbs = [
    { name: "Roodepoort", slug: "roodepoort", available: true },
    { name: "Florida", slug: "florida", available: true },
    { name: "Honeydew", slug: "honeydew", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Western Suburbs"
      city="Johannesburg"
      description="Professional cleaning services across Johannesburg's Western Suburbs. From family homes to apartments, we provide reliable cleaning services for this established residential area."
      suburbs={suburbs}
      highlights={[
        "Family home specialists",
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
