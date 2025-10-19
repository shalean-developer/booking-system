import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { ServiceSelectContent } from "./service-select-content";

// Booking select page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("booking-select"));

export default function ServiceSelectPage() {
  return <ServiceSelectContent />;
}
