import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Johannesburg Southern Suburbs | Shalean",
  description: "Professional cleaning services in Johannesburg's Southern Suburbs including Rosettenville, Southgate, Mondeor, and Turffontein. Expert cleaners available for regular maintenance, deep cleaning, and move-in/out services.",
  canonical: generateCanonical("/location/johannesburg/southern-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-johannesburg-southern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Johannesburg Southern Suburbs"
  }
});

export default function SouthernSuburbsPage() {
  const suburbs = [
    { name: "Rosettenville", slug: "rosettenville", available: true },
    { name: "Southgate", slug: "southgate", available: true },
    { name: "Mondeor", slug: "mondeor", available: true },
    { name: "Turffontein", slug: "turffontein", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Southern Suburbs"
      city="Johannesburg"
      description="Professional cleaning services across Johannesburg's Southern Suburbs. From established neighborhoods to growing communities, we provide reliable cleaning services for diverse residential areas."
      suburbs={suburbs}
      highlights={[
        "Residential specialists",
        "Community-focused service",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
