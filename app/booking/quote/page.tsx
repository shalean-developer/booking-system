import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { QuoteContent } from "./quote-content";

// Booking quote page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("booking-quote"));

export default function QuotePage() {
  return <QuoteContent />;
}
