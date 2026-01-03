import Link from "next/link";
import { MapPin, Home, ArrowRight } from "lucide-react";

interface NearbyAreasSectionProps {
  city: string;
  citySlug: string;
  baseRelatedSuburbs: Array<{ name: string; href: string }>;
}

export function NearbyAreasSection({
  city,
  citySlug,
  baseRelatedSuburbs,
}: NearbyAreasSectionProps) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            We Also Serve Nearby Areas
          </h2>
          <p className="text-xl text-gray-600">
            Professional cleaning services in surrounding neighborhoods across {city}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {baseRelatedSuburbs
            .slice(0, 8)
            .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                {item.name}
              </span>
            </Link>
          ))}
          <Link
            href={`/location/${citySlug}`}
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
  );
}

