import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Atlantic Seaboard Cleaning Services | Shalean Professional Cleaning Services — Expert Home and Apartment Cleaning Services Across the Atlantic Seaboard Including Camps Bay, Sea Point, Green Point, Clifton, Bantry Bay, and Fresnaye",
  description: "Professional cleaning services across the Atlantic Seaboard including Camps Bay, Sea Point, Green Point, Clifton, Bantry Bay, and Fresnaye. Book your trusted cleaner today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/cape-town/atlantic-seaboard"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-atlantic-seaboard-1200x630.jpg",
    alt: "Professional cleaning services on the Atlantic Seaboard"
  }
});

export default function AtlanticSeaboardPage() {
  const suburbs = [
    { name: "Camps Bay", slug: "camps-bay", available: true },
    { name: "Sea Point", slug: "sea-point", available: true },
    { name: "Green Point", slug: "green-point", available: true },
    { name: "Clifton", slug: "clifton", available: true },
    { name: "Bantry Bay", slug: "bantry-bay", available: true },
    { name: "Fresnaye", slug: "fresnaye", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Atlantic Seaboard"
      city="Cape Town"
      description="Experience premium cleaning services along Cape Town's stunning Atlantic Seaboard. From luxury apartments in Camps Bay to historic homes in Sea Point, we provide exceptional cleaning services for this prestigious coastal area."
      suburbs={suburbs}
      highlights={[
        "Luxury property specialists",
        "Oceanfront location expertise",
        "Flexible scheduling for busy professionals",
        "Premium cleaning products",
        "Same-day service available",
        "Strata-compliant cleaning"
      ]}
      available={true}
    />
  );
}
