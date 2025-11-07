'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const majorAreas = [
  { name: 'Sea Point', slug: 'sea-point' },
  { name: 'Camps Bay', slug: 'camps-bay' },
  { name: 'Claremont', slug: 'claremont' },
  { name: 'Green Point', slug: 'green-point' },
  { name: 'CBD', slug: 'city-bowl' },
  { name: 'Gardens', slug: 'gardens' },
  { name: 'Mouille Point', slug: 'mouille-point' },
  { name: 'V&A Waterfront', slug: 'waterfront' },
];

export function HomeServiceAreas() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Cleaning Services Across Cape Town Neighbourhoods
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Shalean provides expert cleaning services throughout Cape Town. 
            Find trusted, professional cleaners in your area.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {majorAreas.map((area) => (
            <Link
              key={area.slug}
              href={`/location/cape-town/${area.slug}`}
              className="group"
            >
              <Card className="h-full border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {area.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Professional cleaners near {area.name}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/location/cape-town"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold"
          >
            Explore Cape Town cleaning service areas
            <MapPin className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

