'use client';

import { useCallback, useMemo } from 'react';
import { useBooking } from '@/lib/useBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Building, 
  Star, 
  Calendar, 
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/booking';

// Helper function to convert ServiceType to URL slug
function serviceTypeToSlug(serviceType: ServiceType): string {
  // Handle "Move In/Out" special case first
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
  fillColor: string;
}[] = [
  {
    type: 'Standard',
    label: 'Standard',
    subLabel: 'Cleaning',
    icon: Home,
    fillColor: 'bg-amber-50',
  },
  {
    type: 'Deep',
    label: 'Deep',
    subLabel: 'Cleaning',
    icon: Star,
    fillColor: 'bg-teal-50',
  },
  {
    type: 'Move In/Out',
    label: 'Moving',
    subLabel: 'Cleaning',
    icon: Building,
    fillColor: 'bg-orange-50',
  },
  {
    type: 'Airbnb',
    label: 'Airbnb',
    subLabel: 'Cleaning',
    icon: Calendar,
    fillColor: 'bg-teal-50',
  },
];

interface StepServiceProps {
  onNext?: () => void;
}

export function StepService({ onNext }: StepServiceProps = {} as StepServiceProps) {
  const { state, updateField, next } = useBooking();

  const handleSelect = useCallback((serviceType: ServiceType) => {
    updateField('service', serviceType);
  }, [updateField]);

  const canProceed = useMemo(() => state.service !== null, [state.service]);

  const handleNext = useCallback(() => {
    if (state.service) {
      // Use new navigation system - just update step, main booking page will handle routing
      next();
    }
  }, [state.service, next]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">Book a service</CardTitle>
        <CardDescription>Choose the type of cleaning service you need</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Horizontal scrollable services */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {services.map((service) => {
              const Icon = service.icon;
              const isSelected = state.service === service.type;
              return (
                <div
                  key={service.type}
                  className={cn(
                    'flex-shrink-0 cursor-pointer rounded-xl border-2 bg-stone-50 p-6 text-center transition-all duration-150 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] min-w-[140px]',
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => handleSelect(service.type)}
                >
                  <div className="flex flex-col items-center gap-4">
                    {/* Icon */}
                    <div className={`relative rounded-full p-4 ${service.fillColor} border border-gray-800`}>
                      <Icon className="h-8 w-8 text-gray-900" strokeWidth={1.5} />
                      {service.type === 'Airbnb' && !isSelected && (
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                          <Sparkles className="h-2.5 w-2.5 text-gray-600" strokeWidth={1.5} />
                          <Sparkles className="h-2.5 w-2.5 text-gray-600" strokeWidth={1.5} />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                    {/* Service name */}
                    <div className="space-y-0.5 text-center">
                      <div className="text-sm font-medium text-gray-900 leading-tight">
                        {service.label}
                      </div>
                      <div className="text-sm font-medium text-gray-900 leading-tight">
                        {service.subLabel}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onNext) {
                onNext();
              } else {
                handleNext();
              }
            }}
            disabled={!canProceed} 
            size="lg"
            className="transition-all duration-150 bg-blue-600 hover:bg-blue-700 text-white"
            type="button"
          >
            Next: Home Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

