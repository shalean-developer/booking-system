import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function AboutMission() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-6">
              At Shalean, we believe everyone deserves a clean, healthy living environment. Our mission is to provide
              exceptional cleaning services that exceed expectations while maintaining our commitment to sustainability
              and customer satisfaction.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Founded with a vision to revolutionize the cleaning industry, we combine professional expertise with
              eco-friendly products and modern technology to deliver superior results every time.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/team">Meet Our Team<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
            <Image 
              src="/images/cleaning-team-hero.jpg" 
              alt="Professional cleaning team from Shalean Cleaning Services in Cape Town - Expert cleaners providing quality service" 
              fill 
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
