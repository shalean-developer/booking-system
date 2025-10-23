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
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";

// Location page metadata with canonical URL
export const metadata: Metadata = createMetadata(getSeoConfig("location"));

export default function LocationPage() {
  // Structured data for LocalBusiness and ServiceArea
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://shalean.co.za/#organization",
    "name": "Shalean Cleaning Services",
    "alternateName": "Shalean",
    "url": "https://shalean.co.za",
    "logo": "https://shalean.co.za/icon-512.png",
    "description": "Professional cleaning services for homes and businesses across South Africa. Expert cleaners, eco-friendly products, 98% satisfaction rate.",
    "telephone": "+27 87 153 5250",
    "email": "support@shalean.co.za",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ZA",
      "addressRegion": "Western Cape",
      "addressLocality": "Cape Town"
    },
    "openingHours": [
      "Mo-Sa 07:00-19:00"
    ],
    "serviceArea": [
      {
        "@type": "City",
        "name": "Cape Town",
        "containedInPlace": {
          "@type": "Country",
          "name": "South Africa"
        }
      },
      {
        "@type": "City", 
        "name": "Johannesburg",
        "containedInPlace": {
          "@type": "Country",
          "name": "South Africa"
        }
      },
      {
        "@type": "City",
        "name": "Pretoria", 
        "containedInPlace": {
          "@type": "Country",
          "name": "South Africa"
        }
      },
      {
        "@type": "City",
        "name": "Durban",
        "containedInPlace": {
          "@type": "Country", 
          "name": "South Africa"
        }
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Cleaning Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Deep Cleaning",
            "description": "Thorough cleaning of kitchens, bathrooms, carpets, and upholstery"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Regular Cleaning",
            "description": "Ongoing home maintenance cleaning services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Move In/Out Cleaning",
            "description": "Professional move-in/out cleaning and Airbnb turnover services"
          }
        }
      ]
    },
    "sameAs": [
      "https://instagram.com/shaleancleaning"
    ],
    "foundingDate": "2020",
    "numberOfEmployees": "50+"
  };
  const serviceAreas = [
    {
      region: "Cape Town",
      areas: ["City Centre", "Northern Suburbs", "Southern Suburbs", "Atlantic Seaboard", "Cape Flats"],
      available: true
    },
    {
      region: "Johannesburg",
      areas: ["Sandton", "Rosebank", "Midrand", "Randburg", "Fourways"],
      available: false
    },
    {
      region: "Pretoria",
      areas: ["Centurion", "Hatfield", "Menlyn", "Brooklyn", "Waterkloof"],
      available: false
    },
    {
      region: "Durban",
      areas: ["Umhlanga", "Morningside", "Berea", "Westville", "Durban North"],
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
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
      <section className="py-20" aria-labelledby="service-areas-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="service-areas-heading" className="text-4xl font-bold text-gray-900 mb-4">
              Our Service Areas
            </h2>
            <p className="text-xl text-gray-600">
              Professional cleaning services across major South African cities
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {serviceAreas.map((area) => (
              <Card key={area.region} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <Link 
                    href={`/location/${area.region.toLowerCase().replace(' ', '-')}`}
                    aria-label={`View cleaning services in ${area.region}`}
                  >
                    <div className="flex items-center gap-4 mb-6 cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {area.region}
                        </h3>
                        {area.available ? (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Now Servicing
                          </span>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">Areas Covered:</h4>
                    <div className="grid grid-cols-2 gap-2" role="list" aria-label={`Suburbs covered in ${area.region}`}>
                      {area.areas.map((location) => (
                        <div key={location} className="flex items-center text-sm text-gray-600" role="listitem">
                          <CheckCircle className="h-3 w-3 text-primary mr-2 flex-shrink-0" aria-hidden="true" />
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link href={`/location/${area.region.toLowerCase().replace(' ', '-')}`}>
                      <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                        View All Suburbs
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
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
                    <Phone className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                  <p className="text-gray-600">
                    <a href="tel:+27871535250" className="hover:text-primary transition-colors">
                      +27 87 153 5250
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Mon-Fri: 8am-6pm</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600">
                    <a href="mailto:support@shalean.co.za" className="hover:text-primary transition-colors">
                      support@shalean.co.za
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">24/7 support</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-primary" aria-hidden="true" />
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
              <Link href="/booking/service/select" aria-label="Book a cleaning service online">
                Book Now
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
              <Link href="/contact" aria-label="Contact Shalean Cleaning Services">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Noscript fallback for service areas */}
      <noscript>
        <div className="py-8 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Areas</h2>
            <p className="text-gray-600 mb-4">
              Professional cleaning services available in:
            </p>
            <ul className="list-disc list-inside text-gray-600">
              <li>Cape Town - Now Servicing</li>
              <li>Johannesburg - Coming Soon</li>
              <li>Pretoria - Coming Soon</li>
              <li>Durban - Coming Soon</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Contact us at <a href="tel:+27871535250" className="text-primary">+27 87 153 5250</a> or 
              <a href="mailto:support@shalean.co.za" className="text-primary"> support@shalean.co.za</a>
            </p>
          </div>
        </div>
      </noscript>
    </div>
  );
}

