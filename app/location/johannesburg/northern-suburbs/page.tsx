import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Northern Suburbs Cleaning Services | Shalean",
  description: "Professional cleaning services in Johannesburg's Northern Suburbs including Sandton, Rosebank, Fourways, Bryanston, Randburg, Hyde Park, Parktown North, and Melrose. Book today!",
  canonical: generateCanonical("/location/johannesburg/northern-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-johannesburg-northern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Johannesburg Northern Suburbs"
  }
});

export default function NorthernSuburbsPage() {
  const suburbs = [
    { name: "Sandton", slug: "sandton", available: true },
    { name: "Rosebank", slug: "rosebank", available: true },
    { name: "Fourways", slug: "fourways", available: true },
    { name: "Bryanston", slug: "bryanston", available: true },
    { name: "Randburg", slug: "randburg", available: true },
    { name: "Hyde Park", slug: "hyde-park", available: true },
    { name: "Parktown North", slug: "parktown-north", available: true },
    { name: "Melrose", slug: "melrose", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Northern Suburbs"
      city="Johannesburg"
      description="Professional cleaning services across Johannesburg's prestigious Northern Suburbs. From luxury apartments in Sandton to family homes in Fourways, we provide exceptional cleaning services for this upmarket area."
      suburbs={suburbs}
      highlights={[
        "Luxury property specialists",
        "Business district expertise",
        "Flexible scheduling for professionals",
        "Premium cleaning products",
        "Same-day service available",
        "Strata-compliant cleaning"
      ]}
      available={true}
    />
  );
}
