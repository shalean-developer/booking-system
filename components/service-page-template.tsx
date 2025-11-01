import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { stringifyStructuredData } from "@/lib/structured-data-validator";
import { 
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  Shield,
  Users,
  Home,
  Building,
  Calendar,
  Sparkles
} from "lucide-react";

interface ServicePageProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  pricing: string;
  pricingNote?: string;
  highlights: string[];
  serviceType: string;
  slug: string;
  color: string;
  iconColor: string;
}

export function ServicePageTemplate({
  title,
  description,
  icon: Icon,
  features,
  pricing,
  pricingNote,
  highlights,
  serviceType,
  slug,
  color,
  iconColor,
}: ServicePageProps) {
  // Generate structured data for Service
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": title,
    "description": description,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Shalean Cleaning Services",
      "url": "https://shalean.co.za",
      "telephone": "+27871535250",
      "email": "support@shalean.co.za"
    },
    "areaServed": {
      "@type": "Country",
      "name": "South Africa"
    },
    "serviceType": serviceType,
    "offers": {
      "@type": "Offer",
      "price": pricing,
      "priceCurrency": "ZAR"
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(structuredData, "Service") }}
      />
      
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Professional Service
            </Badge>
            <div className={`w-20 h-20 rounded-full ${color} flex items-center justify-center mx-auto mb-6`}>
              <Icon className={`h-10 w-10 ${iconColor}`} />
            </div>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              {title}
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                <Link href="/booking/service/select">
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
                <Link href="/booking/quote">
                  Get Quote
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What's Included
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive cleaning services tailored to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-gray-700 font-medium">{feature}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our {title}?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((highlight, idx) => (
              <Card key={idx} className="border-0 shadow-lg text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-gray-700 font-medium">{highlight}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Description Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
              Comprehensive {title} Services
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-4">
                Our {title.toLowerCase()} service is designed to meet the highest standards of cleanliness and professionalism. We understand that every space is unique, and our trained team adapts their approach to ensure optimal results for your specific needs.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                {description} Our commitment to excellence means we use only premium cleaning products that are both effective and safe for your family, pets, and the environment. Each cleaning session is thoroughly planned and executed with attention to detail.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                When you book our {title.toLowerCase()} service, you can expect punctual arrival, respectful and professional service, and a thorough cleaning that exceeds expectations. We stand behind our work with a 100% satisfaction guarantee—if you're not completely happy, we'll return to make it right at no additional cost.
              </p>
              <p className="text-lg text-gray-700">
                Whether you're looking for a one-time deep clean, regular maintenance, or specialized cleaning for a particular occasion, our {title.toLowerCase()} service is flexible and can be customized to your schedule and requirements. Contact us today to discuss your needs and get a personalized quote.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Available Throughout South Africa
            </h2>
            <p className="text-xl text-gray-600">
              Our {title.toLowerCase()} service is available in major cities across South Africa
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/location/cape-town" className="text-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Cape Town</h3>
              <p className="text-sm text-gray-600">Sea Point, Camps Bay, Claremont & more</p>
            </Link>
            <Link href="/location/johannesburg" className="text-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Johannesburg</h3>
              <p className="text-sm text-gray-600">Sandton, Rosebank, Fourways & more</p>
            </Link>
            <Link href="/location/pretoria" className="text-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Pretoria</h3>
              <p className="text-sm text-gray-600">Centurion, Menlyn, Lynnwood & more</p>
            </Link>
            <Link href="/location/durban" className="text-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Durban</h3>
              <p className="text-sm text-gray-600">Umhlanga, Ballito, Morningside & more</p>
            </Link>
          </div>
          <div className="text-center mt-8">
            <Link href="/location">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View All Service Locations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Transparent Pricing
          </h2>
          <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-2xl p-8">
            <div className="text-5xl font-bold text-primary mb-4">{pricing}</div>
            <p className="text-xl text-gray-600 mb-6">
              Starting price for {serviceType.toLowerCase()}
            </p>
            {pricingNote && (
              <p className="text-gray-500 mb-6">{pricingNote}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                <Link href="/booking/service/select">
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Book Your {title}?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Experience professional cleaning services with guaranteed satisfaction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
              <Link href="/booking/service/select">
                Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
              <Link href="/services">
                View All Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
