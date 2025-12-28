import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Frequently Asked Questions | Shalean",
  description: "Find answers to common questions about Shalean cleaning services. Learn about our services, pricing, scheduling, booking process, service areas, and satisfaction guarantee.",
  canonical: generateCanonical("/faq"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/faq-1200x630.jpg",
    alt: "Frequently asked questions about Shalean cleaning services"
  }
});

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

