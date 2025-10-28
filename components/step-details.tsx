'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { PRICING } from '@/lib/pricing';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXTRA_ICONS } from '@/components/extra-service-icons';

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
  
  // Diagnostic logging
  useEffect(() => {
    console.log('🏠 StepDetails rendered with state:', {
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      extras: state.extras,
      extrasCount: state.extras.length
    });
  }, [state.bedrooms, state.bathrooms, state.extras]);

  const handleBack = useCallback(() => {
    // Navigate immediately - step will be updated by the target page's useEffect
    router.push('/booking/service/select');
  }, [router]);

  const handleNext = useCallback(() => {
    // Validate minimum requirements (only bathroom required now)
    if (state.bathrooms < 1) {
      // This validation will be handled by the canProceed check
      return;
    }
    
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/schedule`);
    }
  }, [state.service, state.bathrooms, router]);

  const handleBedroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    console.log('🛏️ Bedroom dropdown changed from', state.bedrooms, 'to', newValue);
    updateField('bedrooms', newValue);
  }, [updateField, state.bedrooms]);

  const handleBathroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    console.log('🚿 Bathroom dropdown changed from', state.bathrooms, 'to', newValue);
    updateField('bathrooms', newValue);
  }, [updateField, state.bathrooms]);

  const toggleExtra = useCallback((extra: string) => {
    const isCurrentlySelected = state.extras.includes(extra);
    console.log('⭐ Extra toggled:', extra, 'currently selected:', isCurrentlySelected);
    const newExtras = isCurrentlySelected 
      ? state.extras.filter((e) => e !== extra)
      : [...state.extras, extra];
    console.log('⭐ New extras array:', newExtras);
    updateField('extras', newExtras);
  }, [state.extras, updateField]);

  // Validation: Ensure minimum 1 bathroom
  const isValid = state.bathrooms >= 1;
  const validationMessage = 
    state.bathrooms < 1 
      ? 'Please select at least 1 bathroom' 
      : '';

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
            <Label className="text-base font-bold text-gray-900">
              Extra Services
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Select any extras to enhance your cleaning service
            </p>
          </div>
          
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6"
            role="group"
            aria-label="Extra services"
          >
            {extrasList.map((extra) => {
              const isSelected = state.extras.includes(extra);
              const IconComponent = EXTRA_ICONS[extra as keyof typeof EXTRA_ICONS];
              return (
                <motion.button
                  key={extra}
                  onClick={() => toggleExtra(extra)}
                  type="button"
                  className={cn(
                    'relative rounded-2xl border p-5 flex flex-col items-center gap-3 cursor-pointer transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]',
                    isSelected
                      ? 'bg-primary/10 ring-4 ring-primary shadow-lg border-primary/30'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                  )}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-labelledby={`extra-${extra}-label`}
                >
                  {/* Icon Container - Green outlined circle */}
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all border-2",
                    isSelected 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-primary/30 bg-white text-gray-700'
                  )}>
                    {IconComponent ? (
                      <IconComponent className="w-6 h-6" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gray-300" />
                    )}
                  </div>

                  {/* Extra Details */}
                  <div className="text-center space-y-1">
                    <div 
                      id={`extra-${extra}-label`}
                      className={cn(
                        "text-sm font-semibold leading-tight",
                        isSelected ? 'text-gray-900' : 'text-gray-700'
                      )}
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
          disabled={!isValid}
          className={cn(
            "rounded-full px-8 py-3 font-semibold shadow-lg",
            isValid ? "bg-primary hover:bg-primary/90 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200"
          )}
          type="button"
        >
          <span className="sm:hidden">Continue</span>
          <span className="hidden sm:inline">Continue to Schedule</span>
        </Button>
      </div>

      {/* Validation Message */}
      {!isValid && validationMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {validationMessage}
        </motion.div>
      )}
    </motion.div>
  );
}

