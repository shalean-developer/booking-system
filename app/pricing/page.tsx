import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { generateCanonical, generateOgImageUrl } from "@/lib/metadata";
import { Header } from "@/components/header";
import { PricingContent } from "./pricing-content";
import { HomeFooterClient } from "@/components/home-footer-client";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = createMetadata({
  title: "Cleaning Services Pricing Cape Town | Transparent Rates | Shalean",
  description: "Clear pricing for cleaning services in Cape Town. Standard cleaning from R250, deep cleaning from R1200. See all rates including service fees. Get instant quote online. No hidden costs.",
  canonical: generateCanonical("/pricing"),
  keywords: [
    "cleaning services pricing Cape Town",
    "house cleaning prices Cape Town",
    "deep cleaning cost Cape Town",
    "maid service rates Cape Town",
    "cleaning service fees Cape Town",
    "affordable cleaning Cape Town",
    "cleaning prices South Africa"
  ],
  ogImage: {
    url: generateOgImageUrl("pricing"),
    alt: "Transparent cleaning services pricing in Cape Town - Shalean Cleaning Services"
  }
});

export default function PricingPage() {
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <PricingContent />
      <HomeFooterClient />
    </div>
  );
}

