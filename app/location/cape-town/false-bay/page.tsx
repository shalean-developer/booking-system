import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "False Bay Cleaning Services | Shalean",
  description: "Professional cleaning services in Cape Town's False Bay area including Muizenberg, Fish Hoek, Kalk Bay, Simon's Town, and Lakeside. Book your trusted cleaner today!",
  canonical: "/location/cape-town/false-bay",
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-false-bay-1200x630.jpg",
    alt: "Professional cleaning services in Cape Town False Bay"
  }
});

export default function FalseBayPage() {
  const suburbs = [
    { name: "Muizenberg", slug: "muizenberg", available: true },
    { name: "Fish Hoek", slug: "fish-hoek", available: true },
    { name: "Kalk Bay", slug: "kalk-bay", available: true },
    { name: "Simon's Town", slug: "simons-town", available: true },
    { name: "Lakeside", slug: "lakeside", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="False Bay"
      city="Cape Town"
      description="Professional cleaning services along Cape Town's beautiful False Bay coastline. From surfing hotspots like Muizenberg to historic Simon's Town, we provide reliable cleaning services for coastal properties."
      suburbs={suburbs}
      highlights={[
        "Coastal property specialists",
        "Salt air cleaning expertise",
        "Beachside home maintenance",
        "Flexible scheduling",
        "Eco-friendly products",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
