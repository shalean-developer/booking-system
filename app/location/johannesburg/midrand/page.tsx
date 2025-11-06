import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Midrand Cleaning Services | Shalean",
  description: "Professional cleaning services in Johannesburg's Midrand area including Midrand, Waterfall, and Halfway House. Book your trusted cleaner today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/johannesburg/midrand"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-johannesburg-midrand-1200x630.jpg",
    alt: "Professional cleaning services in Johannesburg Midrand"
  }
});

export default function MidrandPage() {
  const suburbs = [
    { name: "Midrand", slug: "midrand", available: true },
    { name: "Waterfall", slug: "waterfall", available: true },
    { name: "Halfway House", slug: "halfway-house", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Midrand"
      city="Johannesburg"
      description="Professional cleaning services in Johannesburg's Midrand area. From residential homes to commercial offices, we provide comprehensive cleaning services for this central location."
      suburbs={suburbs}
      highlights={[
        "Home and office specialists",
        "Central location expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}