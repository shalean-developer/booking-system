import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Eastern Suburbs Cleaning Services | Shalean Professional Cleaning Services — Expert Home and Apartment Cleaning Services in Johannesburg's Eastern Suburbs Including Bedfordview, Edenvale, Kempton Park, Benoni, and Boksburg",
  description: "Professional cleaning services in Johannesburg's Eastern Suburbs including Bedfordview, Edenvale, Kempton Park, Benoni, and Boksburg. Book today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/johannesburg/eastern-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-johannesburg-eastern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Johannesburg Eastern Suburbs"
  }
});

export default function EasternSuburbsPage() {
  const suburbs = [
    { name: "Bedfordview", slug: "bedfordview", available: true },
    { name: "Edenvale", slug: "edenvale", available: true },
    { name: "Kempton Park", slug: "kempton-park", available: true },
    { name: "Benoni", slug: "benoni", available: true },
    { name: "Boksburg", slug: "boksburg", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Eastern Suburbs"
      city="Johannesburg"
      description="Professional cleaning services across Johannesburg's Eastern Suburbs. From established neighborhoods like Bedfordview to growing areas like Edenvale, we provide reliable cleaning services for diverse communities."
      suburbs={suburbs}
      highlights={[
        "Established suburb specialists",
        "Family home expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
