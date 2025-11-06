import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Cape Town Northern Suburbs Cleaning Services | Shalean",
  description: "Professional cleaning services in Cape Town's Northern Suburbs including Table View, Bloubergstrand, Milnerton, Durbanville, Bellville, Parow, and Brackenfell. Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/cape-town/northern-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-northern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Cape Town Northern Suburbs"
  }
});

export default function NorthernSuburbsPage() {
  const suburbs = [
    { name: "Table View", slug: "table-view", available: true },
    { name: "Bloubergstrand", slug: "bloubergstrand", available: true },
    { name: "Milnerton", slug: "milnerton", available: true },
    { name: "Durbanville", slug: "durbanville", available: true },
    { name: "Bellville", slug: "bellville", available: true },
    { name: "Parow", slug: "parow", available: true },
    { name: "Brackenfell", slug: "brackenfell", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Northern Suburbs"
      city="Cape Town"
      description="Comprehensive cleaning services across Cape Town's Northern Suburbs. From beachside Table View to family-friendly Durbanville, we provide reliable cleaning services for all types of homes and properties."
      suburbs={suburbs}
      highlights={[
        "Family home specialists",
        "Beachside property expertise",
        "Flexible scheduling for families",
        "Child-safe cleaning products",
        "Regular maintenance programs",
        "Move-in/out cleaning"
      ]}
      available={true}
    />
  );
}
