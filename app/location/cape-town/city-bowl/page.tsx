import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "City Bowl Cleaning Services | Shalean",
  description: "Professional cleaning services in Cape Town's City Bowl including Gardens, City Centre, Tamboerskloof, Oranjezicht, Woodstock, and Observatory. Expert cleaners available for regular maintenance, deep cleaning, and move-in/out services.",
  canonical: generateCanonical("/location/cape-town/city-bowl"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-city-bowl-1200x630.jpg",
    alt: "Professional cleaning services in Cape Town City Bowl"
  }
});

export default function CityBowlPage() {
  const suburbs = [
    { name: "City Centre", slug: "city-centre", available: true },
    { name: "Gardens", slug: "gardens", available: true },
    { name: "Tamboerskloof", slug: "tamboerskloof", available: true },
    { name: "Oranjezicht", slug: "oranjezicht", available: true },
    { name: "Woodstock", slug: "woodstock", available: true },
    { name: "Observatory", slug: "observatory", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="City Bowl"
      city="Cape Town"
      description="Professional cleaning services in Cape Town's vibrant City Bowl. From trendy Woodstock to historic Gardens, we serve all neighborhoods in this central area with reliable, high-quality cleaning services."
      suburbs={suburbs}
      highlights={[
        "Urban living specialists",
        "Historic property expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Apartment and house cleaning"
      ]}
      available={true}
    />
  );
}
