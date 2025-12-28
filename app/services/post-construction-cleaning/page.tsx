import { ServicePageTemplate } from "@/components/service-page-template";
import { Building } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Post-Construction Cleaning Cape Town | Builders Clean",
  description:
    "Professional post-construction cleaning in Cape Town. Builders clean service removes dust & debris. Trusted cleaners near you. Book your post-build clean today.",
  canonical: generateCanonical("/services/post-construction-cleaning"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/services-post-construction-1200x630.jpg",
    alt: "Professional post-construction cleaning service in Cape Town - Shalean Cleaning Services",
  },
});

const features = [
  "Comprehensive dust removal from all surfaces",
  "Construction debris and residue cleanup",
  "Window cleaning (interior and exterior)",
  "Deep cleaning of all fixtures and fittings",
  "Carpet and floor deep cleaning",
  "Appliance cleaning and sanitization",
  "Wall and ceiling cleaning",
  "Final inspection and touch-up cleaning",
];

const highlights = [
  "Transform construction sites into move-in ready spaces",
  "Specialized equipment for construction dust removal",
  "Thorough cleaning of hard-to-reach areas",
  "Professional team experienced in post-build cleanup",
  "Available for residential and commercial projects",
];

const faqs = [
  {
    question: "When should I schedule post-construction cleaning?",
    answer: "Post-construction cleaning should be scheduled after all construction work is complete, including painting, flooring installation, and fixture installation. This ensures we can clean everything thoroughly without construction work continuing afterward."
  },
  {
    question: "What's included in post-construction cleaning?",
    answer: "Our post-construction cleaning includes comprehensive dust removal from all surfaces, construction debris cleanup, window cleaning, deep cleaning of fixtures, carpet and floor cleaning, appliance cleaning, wall and ceiling cleaning, and final inspection."
  },
  {
    question: "How long does post-construction cleaning take?",
    answer: "Post-construction cleaning typically takes 6-12 hours depending on the size of the property and the amount of construction debris. A small renovation may take 6-8 hours, while a full new build can take 10-12 hours or more."
  },
  {
    question: "Do you handle construction waste removal?",
    answer: "We focus on cleaning and debris removal from surfaces. For large construction waste items, you may need to arrange separate disposal. We'll remove all dust, small debris, and construction residue as part of our service."
  },
  {
    question: "Can you clean before final inspection?",
    answer: "Yes, we can clean before final inspection to ensure your property meets all standards. We'll make sure every surface is spotless and ready for inspection by contractors, inspectors, or new occupants."
  }
];

const relatedServices = [
  {
    title: "Deep Cleaning",
    href: "/services/deep-cleaning",
    description: "Thorough deep cleaning for existing properties"
  },
  {
    title: "Move-In Cleaning",
    href: "/services/move-in-cleaning",
    description: "Prepare your new home for move-in"
  },
  {
    title: "Construction Dust Removal",
    href: "/services/construction-dust-removal",
    description: "Specialized dust removal service"
  }
];

export default function PostConstructionCleaningServicePage() {
  return (
    <ServicePageTemplate
      title="Professional Post-Construction Cleaning Services in Cape Town"
      description="Transform your construction site into a pristine space with Shalean's post-construction cleaning in Cape Town. Our professional team removes all dust, debris, and construction residue. Trusted cleaners ensuring your property is move-in ready."
      icon={Building}
      features={features}
      pricing="From R500"
      pricingNote="Quoted based on property size and construction scope"
      highlights={highlights}
      serviceType="Post-Construction Cleaning"
      slug="post-construction-cleaning"
      color="bg-orange-50"
      iconColor="text-orange-600"
      faqs={faqs}
      relatedServices={relatedServices}
    />
  );
}








































