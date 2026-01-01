import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  MapPin, 
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Home
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

const coreServices = [
  {
    title: "Regular Cleaning",
    description: "Recurring housekeeping tailored to coastal apartments and family homes.",
    href: "/services/regular-cleaning",
    cta: "View Regular Cleaning",
  },
  {
    title: "Deep Cleaning",
    description: "Salt-air friendly deep cleans that refresh every corner of your property.",
    href: "/services/deep-specialty",
    cta: "Explore Deep Cleaning",
  },
  {
    title: "Move In/Out",
    description: "Stress-free move cleans for East London landlords, hosts, and relocating families.",
    href: "/services/move-turnover",
    cta: "Book Move Cleaning",
  },
];

export const metadata: Metadata = createMetadata({
  title: "East London Cleaning Services | Shalean",
  description: "Professional cleaning services in East London. Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services throughout East London.",
  canonical: generateCanonical("/location/east-london"),
});

export default function EastLondonPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-amber-500/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Now Servicing
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              East London <span className="text-primary">Cleaning Services</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Professional cleaning services available throughout East London.
              Book your trusted cleaner today!
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
              <Link href="/booking/service/select">
                Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Popular Cleaning Services in East London
            </h2>
            <p className="text-lg text-gray-600">
              Pick a cleaning package and match it with an East London team that knows your neighbourhood.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {coreServices.map((service) => (
              <Card key={service.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Home className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                    <Link href={service.href}>{service.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Related Locations Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Other Eastern Cape Locations
            </h2>
            <p className="text-lg text-gray-600">
              We also provide professional cleaning services in other Eastern Cape cities.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold text-gray-900">Port Elizabeth</h3>
                </div>
                <p className="text-gray-600 mb-4">Professional cleaning services throughout Port Elizabeth.</p>
                <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                  <Link href="/location/port-elizabeth">View Port Elizabeth Services</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold text-gray-900">Jeffreys Bay</h3>
                </div>
                <p className="text-gray-600 mb-4">Expert cleaners available in Jeffreys Bay.</p>
                <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                  <Link href="/location/jeffreys-bay">View Jeffreys Bay Services</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold text-gray-900">Grahamstown</h3>
                </div>
                <p className="text-gray-600 mb-4">Trusted cleaning services in Grahamstown.</p>
                <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                  <Link href="/location/grahamstown">View Grahamstown Services</Link>
                </Button>
              </CardContent>
            </Card>
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

      {/* Additional Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Explore All Our Services
            </h2>
            <p className="text-lg text-gray-600">
              Discover our full range of professional cleaning services available in East London.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/services/one-time-cleaning" className="text-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">One-Time Cleaning</h3>
            </Link>
            <Link href="/services/post-construction-cleaning" className="text-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Post-Construction</h3>
            </Link>
            <Link href="/services/airbnb-cleaning" className="text-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Airbnb Cleaning</h3>
            </Link>
            <Link href="/services" className="text-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">All Services</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Book Your Cleaning Service?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're here to help keep your East London home spotless. Get in touch to check availability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
              <Link href="/contact">
                <Mail className="mr-2 h-5 w-5" />
                Contact Us
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
              <a href="tel:+27871535250">
                <Phone className="mr-2 h-5 w-5" />
                +27 87 153 5250
              </a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/testimonials" className="text-primary hover:underline">Read Testimonials</Link>
            <span className="text-gray-400">•</span>
            <Link href="/blog" className="text-primary hover:underline">Cleaning Tips & Blog</Link>
            <span className="text-gray-400">•</span>
            <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
            <span className="text-gray-400">•</span>
            <Link href="/how-it-works" className="text-primary hover:underline">How It Works</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

