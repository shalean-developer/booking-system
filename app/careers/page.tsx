import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { CareersContent } from "./careers-content";

// Careers page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("careers"));

export default function CareersPage() {
  return <CareersContent />;
}
