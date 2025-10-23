import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  MapPin, 
  Phone,
  Mail,
  CheckCircle,
  ArrowRight,
  Home,
  Clock,
  Users,
  Shield
} from "lucide-react";

interface SuburbPageProps {
  suburb: string;
  city: string;
  area: string;
  description: string;
  highlights?: string[];
  available?: boolean;
}

export function SuburbPageTemplate({
  suburb,
  city,
  area,
  description,
  highlights = [],
  available = true,
}: SuburbPageProps) {
  const defaultHighlights = [
    "Professional, vetted cleaners",
    "Flexible scheduling",
    "100% satisfaction guarantee",
    "Eco-friendly cleaning products available",
    "Same-day service available",
    "Competitive pricing"
  ];

  const features = highlights.length > 0 ? highlights : defaultHighlights;

  // Generate structured data for LocalBusiness
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Shalean Cleaning Services - ${suburb}`,
    "image": `https://shalean.co.za/assets/og/location-${suburb.toLowerCase().replace(/\s+/g, '-')}-1200x630.jpg`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": suburb,
      "addressRegion": "Western Cape",
      "addressCountry": "ZA"
    },
    "telephone": "+27871535250",
    "email": "support@shalean.co.za",
    "url": `https://shalean.co.za/location/${city.toLowerCase().replace(/\s+/g, '-')}/${suburb.toLowerCase().replace(/\s+/g, '-')}`,
    "priceRange": "R200-R1500",
    "areaServed": {
      "@type": "City",
      "name": suburb
    },
    "serviceType": ["Home Cleaning", "Apartment Cleaning", "Deep Cleaning", "Move-in/Move-out Cleaning"],
    "openingHours": "Mo-Su 08:00-18:00",
    "description": description
  };

  // Generate breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shalean.co.za"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Service Areas",
        "item": "https://shalean.co.za/location"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": city,
        "item": `https://shalean.co.za/location/${city.toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": suburb,
        "item": `https://shalean.co.za/location/${city.toLowerCase().replace(/\s+/g, '-')}/${suburb.toLowerCase().replace(/\s+/g, '-')}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className={`mb-4 ${available ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
              {available ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Now Servicing
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Coming Soon
                </>
              )}
            </Badge>
            <div className="flex items-center justify-center gap-2 mb-4 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span>{area}, {city}</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              Cleaning Services in <span className="text-primary">{suburb}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              {description}
            </p>
            {available ? (
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                <Link href="/booking/service/select">
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                <Link href="/contact">
                  Register Interest
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Shalean in {suburb}?
            </h2>
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

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Services in {suburb}
            </h2>
            <p className="text-xl text-gray-600">
              Professional cleaning solutions tailored to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Regular Cleaning</h3>
                <p className="text-gray-600 text-center mb-4">
                  Weekly or bi-weekly home maintenance to keep your space spotless
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Dusting & vacuuming
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Bathroom & kitchen cleaning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Floor mopping
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Deep Cleaning</h3>
                <p className="text-gray-600 text-center mb-4">
                  Thorough, comprehensive cleaning for every corner of your home
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Behind appliances
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Window & door frames
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Grout & tile deep clean
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Move In/Out</h3>
                <p className="text-gray-600 text-center mb-4">
                  Complete cleaning for moving day or property handover
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Empty property cleaning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Cupboard cleaning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Deposit back guarantee
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Services Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Services in {suburb}
            </h2>
            <p className="text-xl text-gray-600">
              Choose from our most requested cleaning services
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Home className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Regular Cleaning</h3>
                <p className="text-gray-600 mb-4">
                  Weekly or bi-weekly maintenance cleaning
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/services/regular-cleaning">
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Deep Cleaning</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive cleaning for every corner
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/services/deep-specialty">
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Move In/Out</h3>
                <p className="text-gray-600 mb-4">
                  Complete cleaning for property transitions
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/services/move-turnover">
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Nearby Areas Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              We Also Serve Nearby Areas
            </h2>
            <p className="text-xl text-gray-600">
              Professional cleaning services in surrounding neighborhoods
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* This would be dynamically populated based on the suburb */}
            <Link
              href={`/location/${city.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                All {city} Areas
              </span>
            </Link>
            <Link
              href="/location"
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                All Locations
              </span>
            </Link>
            <Link
              href="/services"
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <Home className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                All Services
              </span>
            </Link>
            <Link
              href="/booking/service/select"
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <ArrowRight className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                Book Now
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {available ? 'Ready to Book Your Cleaning?' : 'Interested in Our Services?'}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {available 
              ? `Get a free quote for professional cleaning services in ${suburb} today!`
              : `Register your interest and be the first to know when we launch in ${suburb}!`
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {available ? (
              <>
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
              </>
            ) : (
              <>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                  <Link href="/contact">
                    <Mail className="mr-2 h-5 w-5" />
                    Register Interest
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
                  <a href="tel:+27871535250">
                    <Phone className="mr-2 h-5 w-5" />
                    +27 87 153 5250
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

