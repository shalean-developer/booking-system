import { AreaHubTemplate } from "@/components/area-hub-template";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Southern Suburbs Cleaning Services | Shalean Professional Cleaning Services — Expert Home and Apartment Cleaning Services in Cape Town's Southern Suburbs Including Claremont, Newlands, Rondebosch, Wynberg, Kenilworth, Plumstead, Constantia, Bishopscourt, Tokai, and Bergvliet",
  description: "Professional cleaning services in Cape Town's Southern Suburbs including Claremont, Newlands, Rondebosch, Wynberg, Kenilworth, Plumstead, Constantia, Bishopscourt, Tokai, and Bergvliet. Book today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services.",
  canonical: generateCanonical("/location/cape-town/southern-suburbs"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/location-southern-suburbs-1200x630.jpg",
    alt: "Professional cleaning services in Cape Town Southern Suburbs"
  }
});

export default function SouthernSuburbsPage() {
  const suburbs = [
    { name: "Claremont", slug: "claremont", available: true },
    { name: "Newlands", slug: "newlands", available: true },
    { name: "Rondebosch", slug: "rondebosch", available: true },
    { name: "Wynberg", slug: "wynberg", available: true },
    { name: "Kenilworth", slug: "kenilworth", available: true },
    { name: "Plumstead", slug: "plumstead", available: true },
    { name: "Constantia", slug: "constantia", available: true },
    { name: "Bishopscourt", slug: "bishopscourt", available: true },
    { name: "Tokai", slug: "tokai", available: true },
    { name: "Bergvliet", slug: "bergvliet", available: true }
  ];

  return (
    <AreaHubTemplate
      areaName="Southern Suburbs"
      city="Cape Town"
      description="Premium cleaning services across Cape Town's prestigious Southern Suburbs. From historic Constantia to vibrant Claremont, we provide exceptional cleaning services for this leafy, upmarket area."
      suburbs={suburbs}
      highlights={[
        "Upscale property specialists",
        "Historic home expertise",
        "Eco-friendly cleaning products",
        "Flexible scheduling",
        "Regular maintenance programs",
        "Deep cleaning specialists"
      ]}
      available={true}
    />
  );
}
