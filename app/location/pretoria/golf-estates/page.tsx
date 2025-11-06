import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Golf Estates Cleaning Services | Shalean Professional Cleaning Services — Expert Home and Apartment Cleaning Services in Pretoria's Golf Estates Including Silver Lakes, Woodhill, and Mooikloof. Luxury Property Specialists",
  description: "Professional cleaning services in Pretoria's Golf Estates including Silver Lakes, Woodhill, and Mooikloof. Luxury property specialists. Book today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/pretoria/golf-estates"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-pretoria-golf-estates-1200x630.jpg",
    alt: "Professional cleaning services in Pretoria Golf Estates"
  }
});

export default function GolfEstatesPage() {
  const suburbs = [
    { name: "Silver Lakes", slug: "silver-lakes", available: true },
    { name: "Woodhill", slug: "woodhill", available: true },
    { name: "Mooikloof", slug: "mooikloof", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Golf Estates"
      city="Pretoria"
      description="Professional cleaning services across Pretoria's prestigious Golf Estates. Specializing in luxury properties with premium service and attention to detail."
      suburbs={suburbs}
      highlights={[
        "Golf estate specialists",
        "Luxury property expertise",
        "Premium cleaning products",
        "Discreet, professional service",
        "Flexible scheduling",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
