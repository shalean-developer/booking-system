import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { ContactContent } from "./contact-content";

// Contact page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("contact"));

export default function ContactPage() {
  return <ContactContent />;
}
