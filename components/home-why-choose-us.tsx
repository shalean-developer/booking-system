import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap,
  BarChart3,
  Shield,
  Star
} from "lucide-react";

export function HomeWhyChooseUs() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
            Why Choose Shalean
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Everything You Need for a Spotless Home
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            From residential house cleaning services to commercial cleaning, we provide comprehensive cleaning 
            services near you and tools for every type of property.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Expert-Led Services</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Learn from industry professionals with decades of cleaning experience and training.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Eco-Friendly Products</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Leverage cutting-edge green technology to enhance your living environment.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Insured & Bonded</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Master the art of protecting your property with our comprehensive insurance coverage.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Quality Guarantee</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Get satisfaction guarantee and quality assurance with every service.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
