import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Northern Suburbs Cleaning Services | Shalean",
  description: "Professional cleaning services in Pretoria's Northern Suburbs including Montana, Wonderboom, Pretoria North, and Annlin. Book today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/pretoria/northern-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-pretoria-northern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Pretoria Northern Suburbs"
  }
});

export default function NorthernSuburbsPage() {
  const suburbs = [
    { name: "Montana", slug: "montana", available: true },
    { name: "Wonderboom", slug: "wonderboom", available: true },
    { name: "Pretoria North", slug: "pretoria-north", available: true },
    { name: "Annlin", slug: "annlin", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Northern Suburbs"
      city="Pretoria"
      description="Professional cleaning services across Pretoria's Northern Suburbs. From established neighborhoods to growing communities, we provide reliable cleaning services for diverse residential areas."
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
