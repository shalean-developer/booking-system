'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Home, 
  Building, 
  Star, 
  Calendar, 
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/booking';

// Helper function to convert ServiceType to URL slug
function serviceTypeToSlug(serviceType: ServiceType): string {
  if (serviceType === 'Move In/Out') {
    return 'move-in-out';
  }
  
  return serviceType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

const services: { 
  type: ServiceType; 
  label: string;
  subLabel: string;
  icon: any;
  iconColor: string;
}[] = [
  {
    type: 'Standard',
    label: 'Standard',
    subLabel: 'Cleaning',
    icon: Home,
    iconColor: 'text-amber-600',
  },
  {
    type: 'Deep',
    label: 'Deep',
    subLabel: 'Cleaning',
    icon: Star,
    iconColor: 'text-teal-600',
  },
  {
    type: 'Move In/Out',
    label: 'Moving',
    subLabel: 'Cleaning',
    icon: Building,
    iconColor: 'text-orange-600',
  },
  {
    type: 'Airbnb',
    label: 'Airbnb',
    subLabel: 'Cleaning',
    icon: Calendar,
    iconColor: 'text-blue-600',
  },
];

export function StepService() {
  const router = useRouter();
  const { state, updateField } = useBooking();

  const handleSelect = useCallback((serviceType: ServiceType) => {
    updateField('service', serviceType);
  }, [updateField]);

  const canProceed = useMemo(() => state.service !== null, [state.service]);

  const handleNext = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/details`);
    }
  }, [state.service, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Choose Your Service
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Select the type of cleaning service you need
        </p>
      </div>

      {/* Service Cards Grid */}
      <div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-8"
        role="radiogroup"
        aria-label="Service type selection"
      >
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = state.service === service.type;
          return (
            <motion.button
              key={service.type}
              onClick={() => handleSelect(service.type)}
              className={cn(
                'relative rounded-2xl border p-5 md:p-6 flex flex-col items-center gap-3 cursor-pointer transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary/30',
                isSelected
                  ? 'bg-primary/6 ring-2 ring-primary shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              )}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role="radio"
              aria-checked={isSelected}
              aria-labelledby={`service-${service.type}-label`}
            >
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Icon className={cn('h-7 w-7', service.iconColor)} strokeWidth={1.5} />
              </div>

              {/* Service Label */}
              <div 
                id={`service-${service.type}-label`}
                className="text-center space-y-0.5"
              >
                <div className="text-sm font-semibold text-gray-900 leading-tight">
                  {service.label}
                </div>
                <div className="text-xs font-medium text-gray-600 leading-tight">
                  {service.subLabel}
                </div>
              </div>

              {/* Selected Check Mark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* CTA - Bottom Right */}
      <div className="flex justify-end">
        <Button 
          onClick={handleNext}
          disabled={!canProceed} 
          size="lg"
          className={cn(
            "rounded-full px-8 py-3 font-semibold shadow-lg",
            "bg-primary hover:bg-primary/90 text-white",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          type="button"
        >
          <span className="sm:hidden">Continue</span>
          <span className="hidden sm:inline">Continue to Details</span>
        </Button>
      </div>
    </motion.div>
  );
}

