'use client';

import { Settings, Headphones, ThumbsUp, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const services = [
  {
    title: 'Expert workers',
    description: 'Expert workers are highly skilled professionals with extensive experience in their respective fields.',
    icon: User,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-gray-900',
    iconFill: 'fill-yellow-100',
  },
  {
    title: 'Advanced Services',
    description: 'Pioneering excellence, innovating solutions, exceeding expectations consistently.',
    icon: Settings,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-gray-900',
    iconFill: 'fill-yellow-100',
  },
  {
    title: '24/7 Services',
    description: 'Round-the-clock solutions for your needs, anytime, anywhere. Always available.',
    icon: Headphones,
    iconBg: 'bg-orange-100',
    iconColor: 'text-gray-900',
    iconFill: 'fill-orange-100',
    show24: true,
  },
  {
    title: 'Customer Satisfaction',
    description: 'Delighting customers, one exceptional experience at a time, guaranteed satisfaction.',
    icon: ThumbsUp,
    iconBg: 'bg-blue-100',
    iconColor: 'text-gray-900',
    iconFill: 'fill-blue-100',
  },
];

export function HomePopularServices() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Our Services Button */}
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-full mb-6">
            Our Services
          </button>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            We provide the best services
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We prioritize your needs and exceed expectations with professional expertise, creative solutions, and reliable support.
          </p>
        </div>

        {/* Services Grid - 4 cards horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card key={index} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 sm:p-8">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      {index === 0 ? (
                        // Expert workers - User icon
                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center border-2 border-gray-900">
                          <User className="h-8 w-8 text-blue-600 stroke-[2]" />
                        </div>
                      ) : index === 1 ? (
                        // Advanced Services - Settings/Gear icon in yellow
                        <div className="w-16 h-16 rounded-lg bg-yellow-100 flex items-center justify-center border-2 border-gray-900">
                          <Settings className="h-8 w-8 text-gray-900 stroke-[2]" />
                        </div>
                      ) : index === 2 ? (
                        // 24/7 Services - Headphones icon in orange/peach
                        <div className="relative">
                          <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center border-2 border-gray-900">
                            <Headphones className="h-8 w-8 text-gray-900 stroke-[2]" />
                          </div>
                          {service.show24 && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-gray-900">
                              <span className="text-xs font-bold text-gray-900">24</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Customer Satisfaction - ThumbsUp icon
                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center border-2 border-gray-900">
                          <ThumbsUp className="h-8 w-8 text-gray-900 stroke-[2]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base text-gray-600 leading-relaxed text-center">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
