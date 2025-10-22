import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Chatsworth",
    "Durban", 
    "Southern Suburbs",
    "Professional cleaning services in Chatsworth, Durban. Reliable home cleaning with experienced cleaners. Book same-day service in Southern Suburbs.",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Eco-friendly products",
      "Same-day service"
    ]
  );
}

export default function ChatsworthPage() {
  return (
    <SuburbPageTemplate
      suburb="Chatsworth"
      city="Durban"
      area="Southern Suburbs"
      description="Professional cleaning services in Chatsworth, Durban. From family homes to properties in this established Southern Suburbs area."
      highlights={[
        "Home cleaning specialists",
        "Established suburb expertise",
        "Flexible scheduling",
        "Eco-friendly cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
