import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Users, 
  ClipboardList,
  BookOpen,
  ArrowRight
} from "lucide-react";

// Optimized Logo component - static import, no client-side detection
function Logo() {
  return (
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded overflow-hidden bg-primary flex items-center justify-center">
      <Image 
        src="/logo.svg"
        alt="Shalean Logo"
        width={32}
        height={32}
        className="w-7 h-7 sm:w-8 sm:h-8 object-cover"
        priority={false}
      />
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-3 sm:mb-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
              Professional Cleaning Excellence
            </Badge>
          </div>
          <h1 className="mb-4 sm:mb-6 text-3xl font-bold text-gray-900 sm:text-5xl lg:text-7xl">
            Professional Cleaning
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="mx-auto mb-6 sm:mb-8 max-w-3xl text-base sm:text-lg lg:text-xl text-gray-600">
            Book vetted, professional cleaners in minutes. Flexible scheduling, eco-friendly products, 
            and 100% satisfaction guarantee—every single time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg" asChild>
              <Link href="/booking/service/select">
                Book a service
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 rounded-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg" asChild>
              <Link href="/careers">
                Apply to Work
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Key Statistics */}
        <div className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Happy Customers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-gray-700" />
            </div>
            <div className="text-3xl font-bold text-gray-900">500 +</div>
            <div className="text-sm text-gray-600">Happy Customers</div>
          </div>

          {/* Card 2: Satisfaction Rate */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-gray-700" />
            </div>
            <div className="text-3xl font-bold text-gray-900">98%</div>
            <div className="text-sm text-gray-600">Satisfaction Rate</div>
          </div>

          {/* Card 3: Expert Cleaners */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="h-6 w-6 text-gray-700" />
            </div>
            <div className="text-3xl font-bold text-gray-900">50 +</div>
            <div className="text-sm text-gray-600">Expert Cleaners</div>
          </div>

          {/* Card 4: Service Types */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-gray-700" />
            </div>
            <div className="text-3xl font-bold text-gray-900">100 +</div>
            <div className="text-sm text-gray-600">Service Types</div>
          </div>
        </div>
      </div>
    </section>
  );
}
