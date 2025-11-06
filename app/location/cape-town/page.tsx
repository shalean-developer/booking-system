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
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Cape Town Cleaning Services | Shalean",
  description: "Professional cleaning services across all Cape Town suburbs. Expert cleaners available for regular maintenance, deep cleaning, move-in/out, and Airbnb turnover services throughout Cape Town.",
  canonical: generateCanonical("/location/cape-town"),
});

const capeSuburbs = [
  // Atlantic Seaboard
  { name: "Camps Bay", slug: "camps-bay", area: "Atlantic Seaboard" },
  { name: "Sea Point", slug: "sea-point", area: "Atlantic Seaboard" },
  { name: "Green Point", slug: "green-point", area: "Atlantic Seaboard" },
  { name: "Clifton", slug: "clifton", area: "Atlantic Seaboard" },
  { name: "Bantry Bay", slug: "bantry-bay", area: "Atlantic Seaboard" },
  { name: "Fresnaye", slug: "fresnaye", area: "Atlantic Seaboard" },
  
  // City Bowl
  { name: "City Centre", slug: "city-centre", area: "City Bowl" },
  { name: "Gardens", slug: "gardens", area: "City Bowl" },
  { name: "Tamboerskloof", slug: "tamboerskloof", area: "City Bowl" },
  { name: "Oranjezicht", slug: "oranjezicht", area: "City Bowl" },
  { name: "Woodstock", slug: "woodstock", area: "City Bowl" },
  { name: "Observatory", slug: "observatory", area: "City Bowl" },
  
  // Northern Suburbs
  { name: "Table View", slug: "table-view", area: "Northern Suburbs" },
  { name: "Bloubergstrand", slug: "bloubergstrand", area: "Northern Suburbs" },
  { name: "Milnerton", slug: "milnerton", area: "Northern Suburbs" },
  { name: "Durbanville", slug: "durbanville", area: "Northern Suburbs" },
  { name: "Bellville", slug: "bellville", area: "Northern Suburbs" },
  { name: "Parow", slug: "parow", area: "Northern Suburbs" },
  { name: "Brackenfell", slug: "brackenfell", area: "Northern Suburbs" },
  
  // Southern Suburbs
  { name: "Claremont", slug: "claremont", area: "Southern Suburbs" },
  { name: "Newlands", slug: "newlands", area: "Southern Suburbs" },
  { name: "Rondebosch", slug: "rondebosch", area: "Southern Suburbs" },
  { name: "Wynberg", slug: "wynberg", area: "Southern Suburbs" },
  { name: "Kenilworth", slug: "kenilworth", area: "Southern Suburbs" },
  { name: "Plumstead", slug: "plumstead", area: "Southern Suburbs" },
  { name: "Constantia", slug: "constantia", area: "Southern Suburbs" },
  { name: "Bishopscourt", slug: "bishopscourt", area: "Southern Suburbs" },
  { name: "Tokai", slug: "tokai", area: "Southern Suburbs" },
  { name: "Bergvliet", slug: "bergvliet", area: "Southern Suburbs" },
  
  // False Bay
  { name: "Muizenberg", slug: "muizenberg", area: "False Bay" },
  { name: "Fish Hoek", slug: "fish-hoek", area: "False Bay" },
  { name: "Kalk Bay", slug: "kalk-bay", area: "False Bay" },
  { name: "Simon's Town", slug: "simons-town", area: "False Bay" },
  { name: "Lakeside", slug: "lakeside", area: "False Bay" },
  
  // West Coast
  { name: "Hout Bay", slug: "hout-bay", area: "West Coast" },
  { name: "Noordhoek", slug: "noordhoek", area: "West Coast" },
  { name: "Kommetjie", slug: "kommetjie", area: "West Coast" },
  { name: "Scarborough", slug: "scarborough", area: "West Coast" },
  
  // Other Areas
  { name: "Somerset West", slug: "somerset-west", area: "Helderberg" },
  { name: "Strand", slug: "strand", area: "Helderberg" },
  { name: "Stellenbosch", slug: "stellenbosch", area: "Winelands" },
];

export default function CapeTownPage() {
  const groupedSuburbs = capeSuburbs.reduce((acc, suburb) => {
    if (!acc[suburb.area]) acc[suburb.area] = [];
    acc[suburb.area].push(suburb);
    return acc;
  }, {} as Record<string, typeof capeSuburbs>);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Now Servicing
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              Cape Town <span className="text-primary">Cleaning Services</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Professional cleaning services available across all Cape Town suburbs.
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
              All Cape Town Suburbs We Serve
            </h2>
            <p className="text-xl text-gray-600">
              Click on your suburb to learn more about our services in your area
            </p>
          </div>

          <div className="space-y-8">
            {Object.entries(groupedSuburbs).map(([area, suburbs]) => {
              // Handle special cases for area slugs
              let areaSlug: string;
              if (area === 'Helderberg') {
                areaSlug = 'helderberg-winelands';
              } else if (area === 'Winelands') {
                areaSlug = 'helderberg-winelands';
              } else {
                areaSlug = area.toLowerCase().replace(/\s+/g, '-').replace('&', 'and');
              }
              return (
                <Card key={area} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-primary" />
                        <h3 className="text-2xl font-bold text-gray-900">{area}</h3>
                      </div>
                      <Link
                        href={`/location/cape-town/${areaSlug}`}
                        className="text-primary hover:text-primary/80 font-medium text-sm"
                      >
                        View Area Details →
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {suburbs.map((suburb) => (
                        <Link
                          key={suburb.slug}
                          href={`/location/cape-town/${suburb.slug}`}
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
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
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

