import { SuburbPageTemplate } from "@/components/suburb-page-template";
import type { Metadata } from "next";
import { createLocationMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLocationMetadata(
    "Silver Lakes",
    "Pretoria", 
    "Golf Estates",
    "Professional cleaning services in Silver Lakes, Pretoria. Golf estate property cleaning specialists. Book same-day service in Golf Estates.",
    [
      "Golf estate specialists",
      "Luxury home cleaning",
      "Flexible scheduling",
      "Premium service"
    ]
  );
}

export default function SilverLakesPage() {
  return (
    <SuburbPageTemplate
      suburb="Silver Lakes"
      city="Pretoria"
      area="Golf Estates"
      description="Professional cleaning services in Silver Lakes Golf Estate, Pretoria. Specializing in luxury golf estate properties with premium service."
      highlights={[
        "Golf estate specialists",
        "Luxury home expertise",
        "Flexible scheduling",
        "Premium cleaning products",
        "Same-day service available",
        "Regular maintenance programs"
      ]}
      available={true}
    />
  );
}
