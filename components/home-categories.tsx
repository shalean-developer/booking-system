'use client';

import { Home, Building, Factory, Sparkles, Droplets, ArrowRight, Grid3x3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  {
    title: 'Residential Cleaning',
    description: 'Services for homes and apartments.',
    icon: Home,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Commercial Cleaning',
    description: 'Cleaning for businesses and offices.',
    icon: Building,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    title: 'Industrial Cleaning',
    description: 'Heavy-duty and large-scale cleaning.',
    icon: Factory,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    title: 'Specialized Cleaning',
    description: 'Targeted services for specific needs.',
    icon: Sparkles,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    title: 'Outdoor & Exterior Cleaning',
    description: 'Cleaning services for outdoor areas.',
    icon: Droplets,
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    title: 'View all',
    description: '',
    icon: Grid3x3,
    bgColor: 'bg-white',
    iconColor: 'text-gray-600',
    border: true,
    isViewAll: true,
  },
];

export function HomeCategories() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Our Category Button */}
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-full mb-6">
            Our Category
          </button>

          {/* Main Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Our cleaning services
          </h2>

          {/* Description */}
          <div className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed space-y-4">
            <p>
              Comprehensive cleaning solutions for residential, commercial, industrial, specialized, and outdoor cleaning needs.
            </p>
          </div>
        </div>

        {/* Categories Grid - 3 columns, 2 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={index}
                className={`${category.bgColor} border ${category.border ? 'border-gray-200' : 'border-transparent'} rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
              >
                <CardContent className="p-6 sm:p-8 relative">
                  {/* Arrow Button - Top Right */}
                  <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
                    <ArrowRight className="h-4 w-4 text-gray-700" />
                  </button>

                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className={`w-16 h-16 rounded-lg ${category.bgColor === 'bg-white' ? 'bg-gray-100' : category.bgColor} flex items-center justify-center border-2 border-gray-900`}>
                      <Icon className={`h-8 w-8 ${category.iconColor} stroke-[2]`} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
                    {category.title}
                  </h3>

                  {/* Description */}
                  {category.description && (
                    <p className="text-base text-gray-600 leading-relaxed text-center">
                      {category.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

