import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Helderberg & Winelands Cleaning Services | Shalean",
  description: "Professional cleaning services in Cape Town's Helderberg and Winelands areas including Somerset West, Strand, and Stellenbosch. Book your trusted cleaner today!",
  canonical: "/location/cape-town/helderberg-winelands",
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-helderberg-winelands-1200x630.jpg",
    alt: "Professional cleaning services in Helderberg and Winelands"
  }
});

export default function HelderbergWinelandsPage() {
  const suburbs = [
    { name: "Somerset West", slug: "somerset-west", available: true },
    { name: "Strand", slug: "strand", available: true },
    { name: "Stellenbosch", slug: "stellenbosch", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Helderberg & Winelands"
      city="Cape Town"
      description="Professional cleaning services in Cape Town's Helderberg and Winelands regions. From the coastal town of Strand to the historic university town of Stellenbosch, we provide reliable cleaning services for diverse properties."
      suburbs={suburbs}
      highlights={[
        "Wine estate specialists",
        "Historic property expertise",
        "Coastal and inland cleaning",
        "Flexible scheduling",
        "Eco-friendly products",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
