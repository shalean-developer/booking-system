import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Inner City Cleaning Services | Shalean",
  description: "Professional cleaning services in Johannesburg's Inner City including Johannesburg CBD, Braamfontein, Parktown, Houghton, and Westcliff. Expert cleaners available for regular maintenance, deep cleaning, and move-in/out services.",
  canonical: generateCanonical("/location/johannesburg/inner-city"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-johannesburg-inner-city-1200x630.jpg",
    alt: "Professional cleaning services in Johannesburg Inner City"
  }
});

export default function InnerCityPage() {
  const suburbs = [
    { name: "Johannesburg CBD", slug: "johannesburg-cbd", available: true },
    { name: "Braamfontein", slug: "braamfontein", available: true },
    { name: "Parktown", slug: "parktown", available: true },
    { name: "Houghton", slug: "houghton", available: true },
    { name: "Westcliff", slug: "westcliff", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Inner City"
      city="Johannesburg"
      description="Professional cleaning services across Johannesburg's Inner City. From corporate offices in the CBD to historic homes in Houghton, we provide comprehensive cleaning services for this central area."
      suburbs={suburbs}
      highlights={[
        "Office and residential specialists",
        "Historic property expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Commercial cleaning services"
      ]}
      available={true}
    />
  );
}
