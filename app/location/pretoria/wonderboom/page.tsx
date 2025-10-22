import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Wonderboom",
    "Pretoria", 
    "Northern Suburbs",
    "Professional cleaning services in Wonderboom, Pretoria. Reliable home cleaning with experienced cleaners. Book same-day service today!",
    [
      "Home cleaning specialists",
      "Flexible scheduling",
      "Affordable rates",
      "Same-day service"
    ]
  );
}

export default function WonderboomPage() {
  return (
    <SuburbPageTemplate
      suburb="Wonderboom"
      city="Pretoria"
      area="Northern Suburbs"
      description="Professional cleaning services in Wonderboom, Pretoria. From family homes to apartments, we provide reliable cleaning services for this established Northern area."
      highlights={[
        "Home cleaning specialists",
        "Established suburb expertise",
        "Flexible scheduling",
        "Affordable rates",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
