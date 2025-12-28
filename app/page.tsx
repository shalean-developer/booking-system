import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { HomeContent } from "./home-content";
import { HomeStructuredData } from "@/components/home-structured-data";

// Home page metadata - ensure indexable
export const metadata: Metadata = {
  ...createMetadata(getSeoConfig("home")),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function HomePage() {
  return (
    <>
      <HomeStructuredData />
      <HomeContent />
    </>
  );
}
