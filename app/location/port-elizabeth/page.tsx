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
    description: "Stress-free move cleans for Port Elizabeth landlords, hosts, and relocating families.",
    href: "/services/move-turnover",
    cta: "Book Move Cleaning",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Port Elizabeth Cleaning Services | Shalean",
  description: "Professional cleaning services in Port Elizabeth. Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services throughout Port Elizabeth.",
  canonical: generateCanonical("/location/port-elizabeth"),
});

export default function PortElizabethPage() {
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
              Port Elizabeth <span className="text-primary">Cleaning Services</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Professional cleaning services available throughout Port Elizabeth.
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
              Popular Cleaning Services in Port Elizabeth
            </h2>
            <p className="text-lg text-gray-600">
              Pick a cleaning package and match it with a Port Elizabeth team that knows your neighbourhood.
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

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Book Your Cleaning Service?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're here to help keep your Port Elizabeth home spotless. Get in touch to check availability.
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
        </div>
      </section>
    </div>
  );
}

