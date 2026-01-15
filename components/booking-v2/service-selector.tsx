'use client';

import type { ServiceType } from '@/types/booking';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { fallbackServices, iconMap } from './booking-constants';
import type { BookingFormService } from '@/lib/useBookingFormData';

interface ServiceSelectorProps {
  selectedService: ServiceType | null;
  onSelect: (serviceType: ServiceType) => void;
  services?: BookingFormService[];
  loading?: boolean;
}

export function ServiceSelector({ 
  selectedService, 
  onSelect, 
  services = fallbackServices,
  loading = false 
}: ServiceSelectorProps) {
  // Map icon names to components
  const getIconComponent = (iconName: string): LucideIcon => {
    return iconMap[iconName] || iconMap.Home;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 w-64 bg-slate-200 animate-pulse rounded mx-auto" />
          <div className="h-6 w-80 bg-slate-200 animate-pulse rounded mx-auto" />
        </div>
        <div className="flex gap-3 justify-center items-stretch max-w-7xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 min-w-0 max-w-[240px] h-20 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Question */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
          What service do you need?
        </h2>
        <p className="text-base md:text-lg text-gray-700">
          Select the type of cleaning service you require
        </p>
      </div>

      {/* Service Cards Container - Horizontal line, all cards in one row */}
      <div className="flex gap-3 justify-center items-stretch w-full overflow-x-auto">
        {services.map((service) => {
          const Icon = getIconComponent(service.icon);
          const isSelected = selectedService === service.type;

          return (
            <motion.button
              key={service.type}
              type="button"
              onClick={() => onSelect(service.type)}
              className={cn(
                'flex-1 min-w-0 max-w-[240px] bg-white rounded-xl shadow-md p-6',
                'border-2 transition-all duration-200',
                'hover:shadow-lg hover:scale-[1.02]',
                'focus:outline-none focus:ring-2 focus:ring-primary/30',
                'text-left',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-gray-200 hover:border-primary/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              role="radio"
              aria-checked={isSelected}
              aria-labelledby={`service-${service.type}-label`}
            >
              <div className="flex flex-col space-y-3">
                {/* Icon and Title Row */}
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                    <Icon
                      className={cn(
                        'w-10 h-10 transition-colors',
                        isSelected ? 'text-primary' : 'text-gray-400'
                      )}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {service.label}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600">
                  {service.subLabel || service.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

