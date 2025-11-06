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
  CheckCircle
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Johannesburg Cleaning Services | Shalean Professional Cleaning Services Throughout Johannesburg — Expert Home and Apartment Cleaning Services Across All Johannesburg Suburbs Including Northern Suburbs, Midrand, Eastern Suburbs, Southern Suburbs, Western Suburbs, and Inner City",
  description: "Professional cleaning services across all Johannesburg suburbs. Book your trusted cleaner today! Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services throughout Johannesburg.",
  canonical: generateCanonical("/location/johannesburg"),
});

const johannesburgSuburbs = [
  // Northern Suburbs
  { name: "Sandton", slug: "sandton", area: "Northern Suburbs" },
  { name: "Rosebank", slug: "rosebank", area: "Northern Suburbs" },
  { name: "Fourways", slug: "fourways", area: "Northern Suburbs" },
  { name: "Bryanston", slug: "bryanston", area: "Northern Suburbs" },
  { name: "Randburg", slug: "randburg", area: "Northern Suburbs" },
  { name: "Hyde Park", slug: "hyde-park", area: "Northern Suburbs" },
  { name: "Parktown North", slug: "parktown-north", area: "Northern Suburbs" },
  { name: "Melrose", slug: "melrose", area: "Northern Suburbs" },
  
  // Midrand
  { name: "Midrand", slug: "midrand", area: "Midrand" },
  { name: "Waterfall", slug: "waterfall", area: "Midrand" },
  { name: "Halfway House", slug: "halfway-house", area: "Midrand" },
  
  // Eastern Suburbs
  { name: "Bedfordview", slug: "bedfordview", area: "Eastern Suburbs" },
  { name: "Edenvale", slug: "edenvale", area: "Eastern Suburbs" },
  { name: "Kempton Park", slug: "kempton-park", area: "Eastern Suburbs" },
  { name: "Benoni", slug: "benoni", area: "Eastern Suburbs" },
  { name: "Boksburg", slug: "boksburg", area: "Eastern Suburbs" },
  
  // Southern Suburbs
  { name: "Rosettenville", slug: "rosettenville", area: "Southern Suburbs" },
  { name: "Southgate", slug: "southgate", area: "Southern Suburbs" },
  { name: "Mondeor", slug: "mondeor", area: "Southern Suburbs" },
  { name: "Turffontein", slug: "turffontein", area: "Southern Suburbs" },
  
  // Western Suburbs
  { name: "Roodepoort", slug: "roodepoort", area: "Western Suburbs" },
  { name: "Florida", slug: "florida", area: "Western Suburbs" },
  { name: "Honeydew", slug: "honeydew", area: "Western Suburbs" },
  
  // Inner City
  { name: "Johannesburg CBD", slug: "johannesburg-cbd", area: "Inner City" },
  { name: "Braamfontein", slug: "braamfontein", area: "Inner City" },
  { name: "Parktown", slug: "parktown", area: "Inner City" },
  { name: "Houghton", slug: "houghton", area: "Inner City" },
  { name: "Westcliff", slug: "westcliff", area: "Inner City" }
];

export default function JohannesburgPage() {
  const groupedSuburbs = johannesburgSuburbs.reduce((acc, suburb) => {
    if (!acc[suburb.area]) acc[suburb.area] = [];
    acc[suburb.area].push(suburb);
    return acc;
  }, {} as Record<string, typeof johannesburgSuburbs>);

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
              Johannesburg <span className="text-primary">Cleaning Services</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Professional cleaning services available across all Johannesburg suburbs.
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

      {/* Suburbs by Area */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              All Johannesburg Suburbs We Serve
            </h2>
            <p className="text-xl text-gray-600">
              Click on your area to learn more about our services in your neighborhood
            </p>
          </div>

          <div className="space-y-8">
            {Object.entries(groupedSuburbs).map(([area, suburbs]) => {
              const areaSlug = area.toLowerCase().replace(/\s+/g, '-');
              return (
                <Card key={area} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-primary" />
                        <h3 className="text-2xl font-bold text-gray-900">{area}</h3>
                      </div>
                      <Link
                        href={`/location/johannesburg/${areaSlug}`}
                        className="text-primary hover:text-primary/80 font-medium text-sm"
                      >
                        View Area Details →
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {suburbs.map((suburb) => (
                        <Link
                          key={suburb.slug}
                          href={`/location/johannesburg/${suburb.slug}`}
                          className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-gray-700 group-hover:text-primary font-medium">
                            {suburb.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Can't Find Your Suburb?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're constantly expanding our service areas. Get in touch to check availability.
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

