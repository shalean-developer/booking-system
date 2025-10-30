'use client';

import { useCallback, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
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
}[] = [
  {
    type: 'Standard',
    label: 'Standard',
    subLabel: 'Cleaning',
    icon: Home,
  },
  {
    type: 'Deep',
    label: 'Deep',
    subLabel: 'Cleaning',
    icon: Star,
  },
  {
    type: 'Move In/Out',
    label: 'Moving',
    subLabel: 'Cleaning',
    icon: Building,
  },
  {
    type: 'Airbnb',
    label: 'Airbnb',
    subLabel: 'Cleaning',
    icon: Calendar,
  },
];

export function StepService() {
  const router = useRouter();
  const { state, updateField } = useBooking();

  const handleSelect = useCallback((serviceType: ServiceType) => {
    console.log('🎯 Service Selected:', serviceType);
    
    // Navigate immediately - don't wait for state updates
    const slug = serviceTypeToSlug(serviceType);
    router.push(`/booking/service/${slug}/details`);
    
    // Update state in background (non-blocking)
    startTransition(() => {
      updateField('service', serviceType);
    });
  }, [updateField, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-lg py-4 md:py-6 px-3 md:px-4 border border-gray-100"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Choose Your Service
          </h2>
          <p className="text-xs md:text-sm text-gray-600">
            Select the type of cleaning service you need
          </p>
        </div>

        {/* Service Cards Grid */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 mb-6 md:mb-8"
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
                'relative rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden cursor-pointer transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
                isSelected
                  ? 'ring-2 ring-primary border-primary shadow-md'
                  : 'hover:shadow-md hover:border-gray-300',
                'max-w-[140px]'
              )}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0 }}
              role="radio"
              aria-checked={isSelected}
              aria-labelledby={`service-${service.type}-label`}
            >
              {/* Icon Section */}
              <div className={cn(
                'w-full aspect-[4/3] flex items-center justify-center',
                isSelected ? 'bg-primary/10' : 'bg-gray-50'
              )}>
                <Icon 
                  className={cn(
                    'h-8 w-8 md:h-10 md:w-10 transition-colors',
                    isSelected ? 'text-primary' : 'text-gray-700'
                  )} 
                  strokeWidth={1.5} 
                />
              </div>

              {/* Text Section */}
              <div 
                id={`service-${service.type}-label`}
                className="p-2 md:p-2.5 text-left"
              >
                <div className={cn(
                  'text-xs md:text-sm font-semibold leading-tight mb-0.5',
                  isSelected ? 'text-primary' : 'text-gray-900'
                )}>
                  {service.label}
                </div>
                <div className={cn(
                  'text-[10px] md:text-xs font-normal leading-tight',
                  isSelected ? 'text-primary/80' : 'text-gray-600'
                )}>
                  {service.subLabel}
                </div>
              </div>

              {/* Selected Check Mark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
                >
                  <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
        </div>
      </div>
    </motion.div>
  );
}

