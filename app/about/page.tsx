import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { AboutHero } from "@/components/about-hero";
import { AboutMission } from "@/components/about-mission";
import { AboutValues } from "@/components/about-values";
import { AboutStats } from "@/components/about-stats";
import { AboutCTA } from "@/components/about-cta";

// About page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("about"));

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
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

      <AboutHero />
      <AboutMission />
      <AboutValues />
      <AboutStats />
      <AboutCTA />
    </div>
  );
}

