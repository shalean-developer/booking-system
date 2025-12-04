import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Map,
  ArrowRight,
  Home,
  Briefcase,
  MapPin,
  FileText
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";
import { CITY_AREA_DATA, getCityLabel } from "@/lib/location-data";

export const metadata: Metadata = createMetadata({
  title: "Site Map | Shalean Cleaning Services",
  description: "Complete site map of Shalean cleaning services. Find all our pages including services, locations, and resources. Navigate easily to find the information you need about our professional cleaning services.",
  canonical: generateCanonical("/sitemap-html"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/sitemap-1200x630.jpg",
    alt: "Shalean cleaning services site map"
  }
});

export default function SitemapPage() {
  const services = [
    { name: "All Services", href: "/services" },
    { name: "Regular Cleaning", href: "/services/regular-cleaning" },
    { name: "Deep Cleaning", href: "/services/deep-specialty" },
    { name: "Move In/Out Cleaning", href: "/services/move-turnover" },
    { name: "Airbnb Cleaning", href: "/services/airbnb-cleaning" },
    { name: "Office Cleaning", href: "/services/office-cleaning" },
    { name: "Apartment Cleaning", href: "/services/apartment-cleaning" },
    { name: "Window Cleaning", href: "/services/window-cleaning" },
    { name: "Home Maintenance", href: "/services/home-maintenance" }
  ];

  const locations = [
    { name: "All Locations", href: "/location" },
    { name: "Cape Town", href: "/location/cape-town" },
    { name: "Johannesburg", href: "/location/johannesburg" },
    { name: "Pretoria", href: "/location/pretoria" },
    { name: "Durban", href: "/location/durban" }
  ];

  const capeTownAreas = [
    { name: "Atlantic Seaboard", href: "/location/cape-town/atlantic-seaboard" },
    { name: "City Bowl", href: "/location/cape-town/city-bowl" },
    { name: "Northern Suburbs", href: "/location/cape-town/northern-suburbs" },
    { name: "Southern Suburbs", href: "/location/cape-town/southern-suburbs" },
    { name: "False Bay", href: "/location/cape-town/false-bay" },
    { name: "West Coast", href: "/location/cape-town/west-coast" },
    { name: "Helderberg & Winelands", href: "/location/cape-town/helderberg-winelands" }
  ];

  const johannesburgAreas = [
    { name: "Northern Suburbs", href: "/location/johannesburg/northern-suburbs" },
    { name: "Midrand", href: "/location/johannesburg/midrand" },
    { name: "Eastern Suburbs", href: "/location/johannesburg/eastern-suburbs" },
    { name: "Southern Suburbs", href: "/location/johannesburg/southern-suburbs" },
    { name: "Western Suburbs", href: "/location/johannesburg/western-suburbs" },
    { name: "Inner City", href: "/location/johannesburg/inner-city" }
  ];

  const mainPages = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Team", href: "/team" },
    { name: "Contact", href: "/contact" },
    { name: "Careers", href: "/careers" },
    { name: "Blog", href: "/blog" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "FAQ", href: "/faq" },
    { name: "Pricing", href: "/pricing" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cancellation Policy", href: "/cancellation" },
    { name: "POPIA", href: "/popia" },
    { name: "Cookies", href: "/cookies" }
  ];

  const bookingPages = [
    { name: "Book Now", href: "/booking/service/select" },
    { name: "Get Quote", href: "/booking/quote" },
    { name: "Booking Calculator", href: "/booking/calculator" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Map className="h-3 w-3 mr-1" />
              Site Navigation
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              Site <span className="text-primary">Map</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Find all our pages and services organized by category for easy navigation.
            </p>
          </div>
        </div>
      </section>

      {/* Sitemap Sections */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Main Pages */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Home className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">Main Pages</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {mainPages.map((page, idx) => (
                    <Link
                      key={idx}
                      href={page.href}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-gray-700 group-hover:text-primary font-medium">
                        {page.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">Services</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {services.map((service, idx) => (
                    <Link
                      key={idx}
                      href={service.href}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-gray-700 group-hover:text-primary font-medium">
                        {service.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Locations */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Main Cities</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {locations.map((location, idx) => (
                        <Link
                          key={idx}
                          href={location.href}
                          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors" />
                          <span className="text-gray-700 group-hover:text-primary font-medium text-sm">
                            {location.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Cape Town Areas</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {capeTownAreas.map((area, idx) => (
                        <Link
                          key={idx}
                          href={area.href}
                          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors" />
                          <span className="text-gray-700 group-hover:text-primary font-medium text-sm">
                            {area.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Johannesburg Areas</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {johannesburgAreas.map((area, idx) => (
                        <Link
                          key={idx}
                          href={area.href}
                          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors" />
                          <span className="text-gray-700 group-hover:text-primary font-medium text-sm">
                            {area.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                {Object.entries(CITY_AREA_DATA).map(([citySlug, areas]) => (
                  <div key={citySlug} className="mt-6 space-y-3">
                    <h3 className="font-semibold text-gray-900">
                      {getCityLabel(citySlug)} Areas & Suburbs
                    </h3>
                    {areas.map((area) => (
                      <div key={area.slug} className="rounded-lg border border-gray-200 p-3">
                        <Link
                          href={`/location/${citySlug}/${area.slug}`}
                          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 mb-2"
                        >
                          <MapPin className="h-4 w-4" />
                          {area.label}
                        </Link>
                        <div className="ml-5 grid grid-cols-1 md:grid-cols-2 gap-1">
                          {area.suburbs.map((suburb) => (
                            <Link
                              key={suburb.slug}
                              href={`/location/${citySlug}/${suburb.slug}`}
                              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
                            >
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              {suburb.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Booking & Resources */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">Booking & Resources</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Booking</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {bookingPages.map((page, idx) => (
                        <Link
                          key={idx}
                          href={page.href}
                          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors" />
                          <span className="text-gray-700 group-hover:text-primary font-medium text-sm">
                            {page.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Book Your Cleaning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Use our site map to find exactly what you need, or book directly.
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
