import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { QuoteContent } from "@/components/quote-content-optimized";

// Booking quote page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("booking-quote"));

export default function QuotePage() {
  return <QuoteContent />;
}
