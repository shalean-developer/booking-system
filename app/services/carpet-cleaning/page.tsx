import { ServicePageTemplate } from "@/components/service-page-template";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Carpet Cleaning Services Cape Town | Professional Carpet Clean",
  description:
    "Professional carpet cleaning in Cape Town. Deep steam cleaning & shampoo service. Trusted cleaners near you. Remove stains & odours. Book today.",
  canonical: generateCanonical("/services/carpet-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-carpet-cleaning-1200x630.jpg",
    alt: "Professional carpet cleaning service in Cape Town - Shalean Cleaning Services",
  },
});

const features = [
  "Deep steam cleaning for thorough sanitization",
  "Professional carpet shampoo treatment",
  "Stain removal and treatment",
  "Odor elimination",
  "Allergen and dust mite removal",
  "Carpet protection treatment (optional)",
  "Furniture moving and replacement",
  "Quick drying process",
];

const highlights = [
  "Restore your carpets to like-new condition",
  "Advanced steam cleaning technology",
  "Eco-friendly cleaning solutions",
  "Removes deep-seated dirt and allergens",
  "Professional results for homes and offices",
];

const faqs = [
  {
    question: "How often should I have my carpets professionally cleaned?",
    answer: "We recommend professional carpet cleaning every 6-12 months for most homes, or more frequently in high-traffic areas or homes with pets. Regular professional cleaning extends carpet life and maintains appearance."
  },
  {
    question: "What's the difference between steam cleaning and shampoo?",
    answer: "Steam cleaning uses hot water extraction to deep clean and sanitize carpets, while shampoo uses specialized cleaning solutions. We offer both methods and can recommend the best approach for your carpet type and condition."
  },
  {
    question: "How long does it take for carpets to dry?",
    answer: "Carpets typically dry within 4-6 hours after professional cleaning, depending on humidity and ventilation. We use high-powered extraction equipment to minimize moisture, and we can provide fans to speed up the drying process."
  },
  {
    question: "Can you remove all stains?",
    answer: "We can remove most stains, including pet stains, food stains, and general wear. Some permanent stains may lighten but not completely disappear. We'll assess your carpets and provide an honest evaluation before cleaning."
  },
  {
    question: "Do I need to move furniture?",
    answer: "We can move light furniture as part of our service. For heavy items, we'll clean around them or you can arrange to have them moved beforehand. We'll discuss this during booking to ensure we can access all carpeted areas."
  }
];

const relatedServices = [
  {
    title: "Upholstery Cleaning",
    href: "/services/upholstery-cleaning",
    description: "Professional sofa and furniture cleaning"
  },
  {
    title: "Steam Cleaning",
    href: "/services/steam-cleaning",
    description: "Deep steam cleaning for carpets and upholstery"
  },
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Comprehensive deep cleaning service"
  }
];

export default function CarpetCleaningServicePage() {
  return (
    <ServicePageTemplate
      title="Professional Carpet Cleaning Services in Cape Town"
      description="Revive your carpets with Shalean's professional carpet cleaning in Cape Town. Our trusted team uses advanced steam cleaning and shampoo methods to remove deep-seated dirt, stains, and odours. Professional results for homes and offices."
      icon={Sparkles}
      features={features}
      pricing="From R300"
      pricingNote="Quoted based on carpet area and condition"
      highlights={highlights}
      serviceType="Carpet Cleaning"
      slug="carpet-cleaning"
      color="bg-purple-50"
      iconColor="text-purple-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}




























