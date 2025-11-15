import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { stringifyStructuredData } from "@/lib/structured-data-validator";
import { AboutHero } from "@/components/about-hero";
import { AboutMission } from "@/components/about-mission";
import { AboutServicesDetailed } from "@/components/about-services-detailed";
import { AboutValues } from "@/components/about-values";
import { AboutStats } from "@/components/about-stats";
import { AboutCTA } from "@/components/about-cta";

// About page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("about"));

export default function AboutPage() {
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" }
  ];

  // FAQ schema for About page
  const faqs = [
    {
      question: "When was Shalean Cleaning Services founded?",
      answer: "Shalean Cleaning Services was founded in 2020 with a mission to provide exceptional cleaning services across South Africa. We've grown from a small team to over 50 professional cleaners serving Cape Town, Johannesburg, Pretoria, and Durban."
    },
    {
      question: "What makes Shalean different from other cleaning companies?",
      answer: "Shalean combines professional expertise with exceptional customer service. We use eco-friendly products, provide flexible scheduling, offer online booking 24/7, and back every service with our satisfaction guarantee. Our team of 50+ vetted cleaners has served 500+ happy customers."
    },
    {
      question: "Are your cleaners insured and background-checked?",
      answer: "Yes, absolutely. All Shalean cleaners undergo thorough background checks, are fully insured, and professionally trained. We maintain a 98% customer satisfaction rate and stand behind every cleaning service with our 100% satisfaction guarantee."
    },
    {
      question: "What areas does Shalean serve?",
      answer: "We currently serve major cities across South Africa including Cape Town, Johannesburg, Pretoria, and Durban. Within these cities, we cover numerous suburbs and areas. Check our location pages to see if we service your area."
    },
    {
      question: "What cleaning services does Shalean offer?",
      answer: "We offer a comprehensive range of cleaning services including regular cleaning, deep cleaning, move-in/out cleaning, Airbnb turnover cleaning, office cleaning, apartment cleaning, window cleaning, and home maintenance cleaning. All services can be customized to your specific needs."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-white">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(faqSchema, "FAQPage") }}
      />

      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/"><Home className="mr-2 h-4 w-4" />Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      <AboutHero />
      <AboutMission />
      <AboutServicesDetailed />
      <AboutValues />
      <AboutStats />
      <AboutCTA />
    </div>
  );
}

