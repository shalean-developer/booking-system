import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "West Coast Cleaning Services | Shalean",
  description: "Professional cleaning services in Cape Town's West Coast area including Hout Bay, Noordhoek, Kommetjie, and Scarborough. Expert cleaners available for regular maintenance, deep cleaning, and move-in/out services.",
  canonical: generateCanonical("/location/cape-town/west-coast"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-west-coast-1200x630.jpg",
    alt: "Professional cleaning services in Cape Town West Coast"
  }
});

export default function WestCoastPage() {
  const suburbs = [
    { name: "Hout Bay", slug: "hout-bay", available: true },
    { name: "Noordhoek", slug: "noordhoek", available: true },
    { name: "Kommetjie", slug: "kommetjie", available: true },
    { name: "Scarborough", slug: "scarborough", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="West Coast"
      city="Cape Town"
      description="Professional cleaning services along Cape Town's stunning West Coast. From the bustling harbor town of Hout Bay to the serene beaches of Noordhoek, we provide exceptional cleaning services for coastal properties."
      suburbs={suburbs}
      highlights={[
        "Coastal property specialists",
        "Rural and suburban expertise",
        "Beachside home maintenance",
        "Flexible scheduling",
        "Eco-friendly products",
        "Same-day service available"
      ]}
      available={true}
    />
  );
}
