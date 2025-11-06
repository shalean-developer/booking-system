import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Western Suburbs Cleaning Services | Shalean Professional Cleaning Services — Expert Home and Apartment Cleaning Services in Pretoria's Western Suburbs Including Constantia Park, Eldoraigne, and Heuwelsig",
  description: "Professional cleaning services in Pretoria's Western Suburbs including Constantia Park, Eldoraigne, and Heuwelsig. Book today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/pretoria/western-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-pretoria-western-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Pretoria Western Suburbs"
  }
});

export default function WesternSuburbsPage() {
  const suburbs = [
    { name: "Constantia Park", slug: "constantia-park", available: true },
    { name: "Eldoraigne", slug: "eldoraigne", available: true },
    { name: "Heuwelsig", slug: "heuwelsig", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Western Suburbs"
      city="Pretoria"
      description="Professional cleaning services across Pretoria's Western Suburbs. From family homes to suburban properties, we provide reliable cleaning services for this established area."
      suburbs={suburbs}
      highlights={[
        "Family home specialists",
        "Suburban property expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
