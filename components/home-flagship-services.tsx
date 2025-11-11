import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export function HomeFlagshipServices() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div>
            <Badge className="bg-primary text-white border-primary/80 mb-3 sm:mb-4 text-xs sm:text-sm shadow-sm">
              Most Booked Services
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Popular Cape Town Cleaning Services
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Comprehensive house cleaning services and deep cleaning services designed to transform your space 
              from ordinary to extraordinary. As one of Cape Town's leading cleaning companies, we deliver meticulous attention to detail.
            </p>
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">Standard Cleaning</h3>
                  <p className="text-sm sm:text-base text-gray-600">Regular maintenance cleaning to keep your space fresh and organized.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">Deep Cleaning Services</h3>
                  <p className="text-sm sm:text-base text-gray-600">Thorough cleaning sessions that tackle every corner and surface.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">Airbnb Cleaning</h3>
                  <p className="text-sm sm:text-base text-gray-600">Professional turnover cleaning to ensure guest-ready perfection.</p>
                </div>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Looking for a specific suburb? Explore{" "}
              <Link href="/location/cape-town" className="text-primary font-semibold hover:text-primary/80">
                cleaning services across Cape Town
              </Link>{" "}
              and find a Shalean team near you.
            </p>
            <Link href="/services">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Explore All Services
                <span aria-hidden className="ml-2 text-base leading-none">→</span>
              </Button>
            </Link>
          </div>
          <div>
            <div className="relative">
              <div className="rounded-lg overflow-hidden h-64 sm:h-80 lg:h-96 bg-gray-100 relative">
                <Image
                  src="/images/cleaning-team-hero.jpg"
                  alt="Professional cleaning team working in a modern kitchen"
                  width={750}
                  height={422}
                  className="w-full h-full object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 bg-white rounded-lg p-3 sm:p-4 shadow-lg">
                <div className="flex justify-between items-center gap-2">
                  <div>
                    <div className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">100+ Hours</div>
                    <div className="text-xs sm:text-sm text-gray-600">of Cleaning Experience</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">24/7</div>
                    <div className="text-xs sm:text-sm text-gray-600">Customer Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
