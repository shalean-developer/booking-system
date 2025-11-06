import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Upper Areas Cleaning Services | Shalean",
  description: "Professional cleaning services in Durban's Upper Areas including Glenwood, Sherwood, and Durban CBD. Office and home specialists. Book today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/durban/upper-areas"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-durban-upper-areas-1200x630.jpg",
    alt: "Professional cleaning services in Durban Upper Areas"
  }
});

export default function UpperAreasPage() {
  const suburbs = [
    { name: "Glenwood", slug: "glenwood", available: true },
    { name: "Sherwood", slug: "sherwood", available: true },
    { name: "Durban CBD", slug: "durban-cbd", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Upper Areas"
      city="Durban"
      description="Professional cleaning services across Durban's Upper Areas. From family homes in Glenwood to corporate offices in the CBD, we provide comprehensive cleaning services for this diverse region."
      suburbs={suburbs}
      highlights={[
        "Office cleaning specialists",
        "Home cleaning expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "After-hours cleaning"
      ]}
      available={true}
    />
  );
}
