import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { HomeContent } from "./home-content";

// Home page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("home"));

export default function HomePage() {
  return <HomeContent />;
}
