'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const citiesByRegion = [
  {
    region: 'Western Cape',
    cities: [
      { name: 'Cape Town', slug: '/location/cape-town' },
      { name: 'Stellenbosch', slug: '/location/cape-town/stellenbosch' },
      { name: 'Paarl', slug: '/location/cape-town/paarl' },
      { name: 'George', slug: '/location/cape-town/george' },
    ],
  },
  {
    region: 'Gauteng',
    cities: [
      { name: 'Johannesburg', slug: '/location/johannesburg' },
      { name: 'Pretoria', slug: '/location/pretoria' },
      { name: 'Sandton', slug: '/location/johannesburg/sandton' },
      { name: 'Midrand', slug: '/location/johannesburg/midrand' },
    ],
  },
  {
    region: 'KwaZulu-Natal',
    cities: [
      { name: 'Durban', slug: '/location/durban' },
      { name: 'Pietermaritzburg', slug: '/location/durban/pietermaritzburg' },
      { name: 'Umhlanga', slug: '/location/durban/umhlanga' },
      { name: 'Ballito', slug: '/location/durban/ballito' },
    ],
  },
  {
    region: 'Eastern Cape',
    cities: [
      { name: 'Port Elizabeth', slug: '/location/port-elizabeth' },
      { name: 'East London', slug: '/location/east-london' },
      { name: 'Grahamstown', slug: '/location/grahamstown' },
      { name: 'Jeffreys Bay', slug: '/location/jeffreys-bay' },
    ],
  },
];

export function HomeCities() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Title */}
        <motion.h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Cleaning Services Across Cape Town & South Africa
        </motion.h2>
        
        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Map Icon - Left Side */}
          <motion.div
            className="flex-shrink-0 mx-auto lg:mx-0"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-32 h-32 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center shadow-sm">
              <MapPin className="h-16 w-16 text-primary" strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* City Lists - Four Columns */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {citiesByRegion.map((region, index) => (
              <motion.div
                key={index}
                className="flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  {region.region}:
                </h3>
                <ul className="space-y-2.5">
                  {region.cities.map((city, cityIndex) => (
                    <li key={cityIndex}>
                      <Link
                        href={city.slug}
                        className="text-base text-gray-600 hover:text-primary transition-colors duration-200 hover:underline inline-block"
                        title={`Cleaning services in ${city.name}`}
                      >
                        {city.name} Cleaning Services
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

