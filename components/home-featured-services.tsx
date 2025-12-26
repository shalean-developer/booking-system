'use client';

import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const featuredServices = [
  {
    id: 1,
    category: 'Cleaning',
    title: 'House Cleaning',
    location: 'Cape Town, South Africa',
    description: 'Experience premier house cleaning services where meticulous attention meets exceptional results. Our skilled professionals transform your home into a pristine sanctuary, giving you more time to enjoy life\'s moments in a spotless, serene environment.',
    serviceType: 'Standard',
    image: '/images/service-standard-cleaning.jpg',
    imagePosition: 'left' as const,
  },
  {
    id: 2,
    category: 'Cleaning',
    title: 'Deep Cleaning',
    location: 'Cape Town, South Africa',
    description: 'Reset your home or office with a floor-to-ceiling deep clean that removes built-up grime, allergens, and hidden dust. Inside appliances, grout scrub and detailed wipe-downs for seasonal or post-event resets.',
    serviceType: 'Deep',
    image: '/images/service-deep-cleaning.jpg',
    imagePosition: 'right' as const,
  },
];

export function HomeFeaturedServices() {
  const [prices, setPrices] = useState<Record<string, string>>({
    Standard: 'From R250',
    Deep: 'From R450',
  });

  useEffect(() => {
    fetch('/api/services/check')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.services) {
          const priceMap: Record<string, string> = {};
          data.services.forEach((service: { service_type: string; base: number }) => {
            priceMap[service.service_type] = `From R${service.base}`;
          });
          setPrices(priceMap);
        }
      })
      .catch(() => {
        // Keep default fallback prices
      });
  }, []);

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Featured services Button */}
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-full mb-6">
            Featured services
          </button>

          {/* Main Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Explore Our Greatest Services
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our carefully curated selection of services designed to simplify your life and elevate your experiences.
          </p>
        </div>

        {/* Featured Services List */}
        <div className="space-y-8 lg:space-y-12">
          {featuredServices.map((service) => {
            const serviceType = service.serviceType;
            const price: string = serviceType && prices[serviceType] 
              ? prices[serviceType] 
              : serviceType === 'Deep' 
                ? 'From R450' 
                : 'From R250';
            
            return (
            <div
              key={service.id}
              className={`flex flex-col ${
                service.imagePosition === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } gap-8 lg:gap-12 items-center`}
            >
              {/* Content */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                {/* Small Heading */}
                <div className="text-sm sm:text-base font-medium text-gray-500 uppercase tracking-wide mb-4">
                  {service.category}
                </div>

                {/* Large Title */}
                <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Price and Book Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {price}
                  </span>
                  <Button
                    className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white rounded-full px-6 py-3 text-base sm:text-lg font-medium flex items-center gap-2"
                  >
                    Book now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Image in rounded frame with background */}
              <div className="w-full lg:w-1/2 relative">
                <div className="relative h-[250px] sm:h-[320px] lg:h-[400px] rounded-2xl overflow-hidden bg-gray-100">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

