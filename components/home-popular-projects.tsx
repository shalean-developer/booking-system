'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Service {
  serviceType: string;
  category: string;
  avgPrice: string;
  basePrice: number;
  icon: string;
  image: string;
  order: number;
}

export function HomePopularServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch services from API (which fetches from database)
        const response = await fetch('/api/services/popular', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API returned ${response.status}`);
        }
        
        const data = await response.json();
        const fetchedServices = data.services || [];
        
        console.log('Fetched services from API:', fetchedServices);
        console.log('Number of services:', fetchedServices.length);
        // Log image URLs to verify they're local
        fetchedServices.forEach((s: Service) => {
          console.log(`📷 ${s.category}: ${s.image || '(no image)'}`);
        });
        
        if (fetchedServices.length === 0) {
          console.warn('No services returned from API. Response data:', data);
          throw new Error(data.message || 'No services found in database');
        }
        
        // Use services fetched from database
        setServices(fetchedServices);
      } catch (err: any) {
        console.error('Error fetching services:', err);
        setError(err?.message || 'Failed to load services from database');
        setServices([]); // Empty array - will show error message
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  // Loading state
  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Cleaning Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state or no services
  if (error || services.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Cleaning Services</h2>
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 font-medium mb-2">Unable to load services</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <p className="text-gray-400 text-xs mt-4">
                Check browser console for details. Make sure:
                <br />1. Services table exists and has data
                <br />2. Pricing config table has matching service types
                <br />3. RLS policies allow public read access
              </p>
            </div>
          )}
          {!error && services.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No services available. Please check the database configuration.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Cleaning Services</h2>
        
        {/* Grid Layout - Responsive: 1 column mobile, 2 tablet, 4-5 desktop depending on services */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${services.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
          {services.map((service, index) => (
            <motion.article
              key={service.serviceType}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/services/${service.serviceType.toLowerCase().replace(/\s+/g, '-')}`} className="block">
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={service.image || '/images/service-standard-cleaning.jpg'}
                    alt={`${service.category} services in Cape Town - Shalean Cleaning`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized={service.image?.startsWith('/images/')}
                    onError={(e) => {
                      console.error(`❌ Failed to load image: ${service.image} for ${service.category}`);
                      e.currentTarget.parentElement!.style.backgroundColor = '#e5e7eb';
                    }}
                    onLoad={() => {
                      console.log(`✅ Loaded image: ${service.image} for ${service.category}`);
                    }}
                  />
                  <div className="absolute top-4 right-4 text-2xl" aria-hidden="true">{service.icon}</div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">{service.category}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="font-medium text-primary">From {service.avgPrice}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    Professional {service.category.toLowerCase()} services in Cape Town
                  </p>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

