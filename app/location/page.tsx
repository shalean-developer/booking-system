import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Home, 
  MapPin, 
  Phone,
  Mail,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Areas | Shalean Cleaning Services",
  description: "We provide professional cleaning services across South Africa. Find out if we service your area and get in touch for a free quote.",
};

export default function LocationPage() {
  const serviceAreas = [
    {
      region: "Cape Town",
      areas: ["City Centre", "Northern Suburbs", "Southern Suburbs", "Atlantic Seaboard", "Cape Flats"],
      available: true
    },
    {
      region: "Johannesburg",
      areas: ["Sandton", "Rosebank", "Midrand", "Randburg", "Fourways"],
      available: true
    },
    {
      region: "Pretoria",
      areas: ["Centurion", "Hatfield", "Menlyn", "Brooklyn", "Waterkloof"],
      available: true
    },
    {
      region: "Durban",
      areas: ["Umhlanga", "Morningside", "Berea", "Westville", "Durban North"],
      available: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Service Coverage
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              Where We <span className="text-primary">Serve</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Professional cleaning services available across major South African cities.
              Can't find your area? Contact us—we're always expanding!
            </p>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {serviceAreas.map((area) => (
              <Card key={area.region} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{area.region}</h2>
                      {area.available && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Now Servicing
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">Areas Covered:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {area.areas.map((location) => (
                        <div key={location} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
                <p className="text-gray-600">
                  Don't see your area listed? We're expanding our service coverage.
                  Contact us to check availability in your location.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                  <p className="text-gray-600">+27 87 153 5250</p>
                  <p className="text-sm text-gray-500 mt-1">Mon-Fri: 8am-6pm</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600">farai@shalean.com</p>
                  <p className="text-sm text-gray-500 mt-1">24/7 support</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Business Hours</h3>
                  <p className="text-gray-600">Mon-Sat: 7am-7pm</p>
                  <p className="text-sm text-gray-500 mt-1">Sunday: Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Book Your Service?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Check availability and get your free quote today.
          </p>
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
      </section>
    </div>
  );
}

