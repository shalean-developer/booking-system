'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { PRICING } from '@/lib/pricing';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const extrasList = Object.keys(PRICING.extras) as Array<keyof typeof PRICING.extras>;

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

export function StepDetails() {
  const router = useRouter();
  const { state, updateField } = useBooking();

  const handleBack = useCallback(() => {
    // Navigate immediately - step will be updated by the target page's useEffect
    router.push('/booking/service/select');
  }, [router]);

  const handleNext = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/schedule`);
    }
  }, [state.service, router]);

  const handleBedroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    updateField('bedrooms', newValue);
  }, [updateField]);

  const handleBathroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    updateField('bathrooms', newValue);
  }, [updateField]);

  const toggleExtra = useCallback((extra: string) => {
    if (state.extras.includes(extra)) {
      updateField('extras', state.extras.filter((e) => e !== extra));
    } else {
      updateField('extras', [...state.extras, extra]);
    }
  }, [state.extras, updateField]);

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
          Home Details
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Tell us about your space and any extras you need
        </p>
      </div>

      {/* Form Content */}
      <div className="space-y-8">
        {/* Bedrooms & Bathrooms */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Bedrooms */}
          <div className="space-y-2">
            <Label htmlFor="bedrooms" className="text-sm font-semibold text-gray-900">
              Bedrooms
            </Label>
            <Select value={state.bedrooms.toString()} onValueChange={handleBedroomChange}>
              <SelectTrigger id="bedrooms" className="h-11">
                <SelectValue placeholder="Select bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Studio / 0 Bedrooms</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4 Bedrooms</SelectItem>
                <SelectItem value="5">5+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bathrooms */}
          <div className="space-y-2">
            <Label htmlFor="bathrooms" className="text-sm font-semibold text-gray-900">
              Bathrooms
            </Label>
            <Select value={state.bathrooms.toString()} onValueChange={handleBathroomChange}>
              <SelectTrigger id="bathrooms" className="h-11">
                <SelectValue placeholder="Select bathrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Bathroom</SelectItem>
                <SelectItem value="2">2 Bathrooms</SelectItem>
                <SelectItem value="3">3 Bathrooms</SelectItem>
                <SelectItem value="4">4 Bathrooms</SelectItem>
                <SelectItem value="5">5+ Bathrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Extras */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-900">
              Additional Services
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Select any extras to enhance your cleaning service
            </p>
          </div>
          
          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6"
            role="group"
            aria-label="Additional services"
          >
            {extrasList.map((extra) => {
              const isSelected = state.extras.includes(extra);
              return (
                <motion.button
                  key={extra}
                  onClick={() => toggleExtra(extra)}
                  type="button"
                  className={cn(
                    'relative rounded-2xl border p-5 flex flex-col items-center gap-3 cursor-pointer transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]',
                    isSelected
                      ? 'bg-primary/6 ring-2 ring-primary shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                  )}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-labelledby={`extra-${extra}-label`}
                >
                  {/* Icon Container */}
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  )}>
                    {isSelected ? (
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <Plus className="h-5 w-5" strokeWidth={2} />
                    )}
                  </div>

                  {/* Extra Details */}
                  <div className="text-center space-y-1">
                    <div 
                      id={`extra-${extra}-label`}
                      className="text-sm font-semibold text-gray-900 leading-tight"
                    >
                      {extra}
                    </div>
                    <div className="text-xs font-medium text-gray-600">
                      +R{PRICING.extras[extra]}
                    </div>
                  </div>

                  {/* Selected Check Mark Badge */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Special Instructions */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-semibold text-gray-900">
            Special Instructions
            <span className="text-gray-500 font-normal ml-2">(Optional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Any specific requirements, areas of focus, or special considerations..."
            value={state.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            className="resize-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3 mt-8 pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          size="lg" 
          className={cn(
            "rounded-full px-6 font-semibold",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200"
          )}
          type="button"
        >
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to Service</span>
        </Button>
        <Button 
          onClick={handleNext} 
          size="lg" 
          className={cn(
            "rounded-full px-8 py-3 font-semibold shadow-lg",
            "bg-primary hover:bg-primary/90 text-white",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200"
          )}
          type="button"
        >
          <span className="sm:hidden">Continue</span>
          <span className="hidden sm:inline">Continue to Schedule</span>
        </Button>
      </div>
    </motion.div>
  );
}

