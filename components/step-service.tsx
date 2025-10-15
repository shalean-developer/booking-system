'use client';

import { useCallback, useMemo } from 'react';
import { useBooking } from '@/lib/useBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/booking';

const services: { type: ServiceType; title: string; description: string; multiplier: string }[] = [
  {
    type: 'Standard',
    title: 'Standard Cleaning',
    description: 'Regular cleaning for maintaining a clean home',
    multiplier: '1.0x base',
  },
  {
    type: 'Deep',
    title: 'Deep Cleaning',
    description: 'Thorough cleaning including hard-to-reach areas',
    multiplier: '1.4x base',
  },
  {
    type: 'Move In/Out',
    title: 'Moving Cleaning',
    description: 'Complete cleaning for moving in or out',
    multiplier: '1.6x base',
  },
  {
    type: 'Airbnb',
    title: 'Airbnb Cleaning',
    description: 'Quick turnover cleaning between guests',
    multiplier: '1.2x base',
  },
];

export function StepService() {
  const { state, updateField, next } = useBooking();

  const handleSelect = useCallback((serviceType: ServiceType) => {
    updateField('service', serviceType);
  }, [updateField]);

  const canProceed = useMemo(() => state.service !== null, [state.service]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Select Your Service</CardTitle>
        <CardDescription>Choose the type of cleaning service you need</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const isSelected = state.service === service.type;
            return (
              <Card
                key={service.type}
                className={cn(
                  'cursor-pointer border-2 transition-all duration-150 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
                onClick={() => handleSelect(service.type)}
              >
                <CardHeader className="relative pb-3">
                  {isSelected && (
                    <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="text-xs">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-medium text-slate-600">{service.multiplier}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            onClick={next} 
            disabled={!canProceed} 
            size="lg"
            className="transition-all duration-150"
            type="button"
          >
            Next: Home Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

