import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Garden Route Cleaning Services | Shalean",
  description: "Professional cleaning services across the Garden Route including George. Expert cleaners available for regular maintenance, deep cleaning, and move-in/out services.",
  canonical: generateCanonical("/location/cape-town/garden-route"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-garden-route-1200x630.jpg",
    alt: "Professional cleaning services in the Garden Route"
  }
});

export default function GardenRoutePage() {
  const suburbs = [
    { name: "George", slug: "george", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Garden Route"
      city="Cape Town"
      description="Experience professional cleaning services in the beautiful Garden Route region. From George to surrounding areas, we provide exceptional cleaning services for homes and businesses in this scenic coastal region."
      suburbs={suburbs}
      highlights={[
        "Regional cleaning specialists",
        "Coastal location expertise",
        "Flexible scheduling for busy professionals",
        "Premium cleaning products",
        "Same-day service available",
        "Residential and commercial cleaning"
      ]}
      available={true}
    />
  );
}

