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

export const metadata: Metadata = {
  title: "Durban Cleaning Services | Shalean",
  description: "Professional cleaning services across all Durban suburbs. Book your trusted cleaner today!",
};

const durbanSuburbs = [
  // Coastal Areas
  { name: "Umhlanga", slug: "umhlanga", area: "Coastal North" },
  { name: "Ballito", slug: "ballito", area: "Coastal North" },
  { name: "La Lucia", slug: "la-lucia", area: "Coastal North" },
  { name: "Durban North", slug: "durban-north", area: "Coastal North" },
  { name: "Umdloti", slug: "umdloti", area: "Coastal North" },
  
  // Central
  { name: "Morningside", slug: "morningside", area: "Central" },
  { name: "Berea", slug: "berea", area: "Central" },
  { name: "Musgrave", slug: "musgrave", area: "Central" },
  { name: "Greyville", slug: "greyville", area: "Central" },
  { name: "Windermere", slug: "windermere", area: "Central" },
  
  // Western Suburbs
  { name: "Westville", slug: "westville", area: "Western Suburbs" },
  { name: "Hillcrest", slug: "hillcrest", area: "Western Suburbs" },
  { name: "Kloof", slug: "kloof", area: "Western Suburbs" },
  { name: "Pinetown", slug: "pinetown", area: "Western Suburbs" },
  { name: "Queensburgh", slug: "queensburgh", area: "Western Suburbs" },
  
  // Southern Suburbs
  { name: "Bluff", slug: "bluff", area: "Southern Suburbs" },
  { name: "Wentworth", slug: "wentworth", area: "Southern Suburbs" },
  { name: "Montclair", slug: "montclair", area: "Southern Suburbs" },
  { name: "Chatsworth", slug: "chatsworth", area: "Southern Suburbs" },
  
  // South Coast
  { name: "Amanzimtoti", slug: "amanzimtoti", area: "South Coast" },
  { name: "Umkomaas", slug: "umkomaas", area: "South Coast" },
  { name: "Warner Beach", slug: "warner-beach", area: "South Coast" },
  
  // Upper Areas
  { name: "Glenwood", slug: "glenwood", area: "Upper Areas" },
  { name: "Sherwood", slug: "sherwood", area: "Upper Areas" },
  { name: "Durban CBD", slug: "durban-cbd", area: "Upper Areas" },
];

export default function DurbanPage() {
  const groupedSuburbs = durbanSuburbs.reduce((acc, suburb) => {
    if (!acc[suburb.area]) acc[suburb.area] = [];
    acc[suburb.area].push(suburb);
    return acc;
  }, {} as Record<string, typeof durbanSuburbs>);

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
              Durban <span className="text-primary">Cleaning Services</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Professional cleaning services available across all Durban suburbs.
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
              All Durban Suburbs We Serve
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
                        href={`/location/durban/${areaSlug}`}
                        className="text-primary hover:text-primary/80 font-medium text-sm"
                      >
                        View Area Details →
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {suburbs.map((suburb) => (
                        <Link
                          key={suburb.slug}
                          href={`/location/durban/${suburb.slug}`}
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

