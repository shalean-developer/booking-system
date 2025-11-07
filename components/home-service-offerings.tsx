import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home,
  Building,
  Calendar,
  ArrowRight
} from "lucide-react";

export function HomeServiceOfferings() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
            Our Services
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Cape Town Cleaning Service Packages
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive range of professional cleaning services near me, including house cleaning,{" "}
            <Link href="/services/deep-specialty" className="text-primary font-semibold hover:text-primary/80">
              deep cleaning services in Cape Town
            </Link>
            , and home cleaning services for every need.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-40 sm:h-48 relative bg-gradient-to-br from-primary/20 to-primary/40">
              <Image
                src="/images/home-maintenance.jpg"
                alt="Home maintenance cleaning service"
                width={400}
                height={300}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center text-white">
                  <Home className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-2 opacity-80" />
                  <p className="text-sm sm:text-base font-medium">Home Maintenance</p>
                </div>
              </div>
            </div>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Home Maintenance</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Regular house cleaning services for ongoing upkeep. Ideal for one-off or recurring visits.
              </p>
              <Link href="/services/home-maintenance">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 text-sm sm:text-base" aria-label="Learn more about Home Maintenance">
                  Learn More
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-40 sm:h-48 relative bg-gradient-to-br from-blue-100 to-blue-200">
              <Image
                src="/images/deep-specialty.jpg"
                alt="Deep cleaning and specialty services"
                width={400}
                height={300}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center text-white">
                  <Building className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-2 opacity-80" />
                  <p className="text-sm sm:text-base font-medium">Deep & Specialty</p>
                </div>
              </div>
            </div>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Deep & Specialty</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Intensive deep cleaning services and focused specialty cleaning such as deep cleans, carpets & upholstery, and other specialty tasks.
              </p>
              <Link href="/services/deep-specialty">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 text-sm sm:text-base" aria-label="Learn more about Deep & Specialty">
                  Learn More
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-40 sm:h-48 relative bg-gradient-to-br from-green-100 to-green-200">
              <Image
                src="/images/move-turnover.jpg"
                alt="Move in/out and turnover cleaning services"
                width={400}
                height={300}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center text-white">
                  <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-2 opacity-80" />
                  <p className="text-sm sm:text-base font-medium">Move & Turnover</p>
                </div>
              </div>
            </div>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Move & Turnover</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Move-in/out and Airbnb turnover cleans for transitions and guest changeovers.
              </p>
              <Link href="/services/move-turnover">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 text-sm sm:text-base" aria-label="Learn more about Move & Turnover">
                  Learn More
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
