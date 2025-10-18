'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, Clock } from 'lucide-react';
import { generateTimeSlots, getCurrentPricing } from '@/lib/pricing';
import { FrequencySelector } from '@/components/frequency-selector';

const timeSlots = generateTimeSlots();

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

export function StepSchedule() {
  const router = useRouter();
  const { state, updateField } = useBooking();
  const [discounts, setDiscounts] = useState<{ [key: string]: number }>({});

  const selectedDate = useMemo(() => 
    state.date ? new Date(state.date) : undefined, 
    [state.date]
  );

  // Fetch frequency discounts
  useEffect(() => {
    getCurrentPricing().then((pricing) => {
      setDiscounts(pricing.frequencyDiscounts);
    }).catch((error) => {
      console.error('Failed to fetch frequency discounts:', error);
    });
  }, []);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      updateField('date', format(date, 'yyyy-MM-dd'));
    }
  }, [updateField]);

  const handleTimeSelect = useCallback((time: string) => {
    updateField('time', time);
  }, [updateField]);

  const canProceed = useMemo(() => 
    state.date !== null && state.time !== null, 
    [state.date, state.time]
  );

  const handleBack = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/details`);
    }
  }, [state.service, router]);

  const handleNext = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/contact`);
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
          Choose Your Schedule
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Select a date and time that works best for you
        </p>
      </div>

      {/* Form Content */}
      <div className="space-y-8">
        {/* Date Picker */}
        <div className="space-y-3">
          <Label htmlFor="date-picker" className="text-sm font-semibold text-gray-900">
            Preferred Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-picker"
                variant="outline"
                className={cn(
                  'w-full h-14 justify-start text-left font-normal rounded-xl border-2',
                  'hover:border-gray-300 hover:bg-gray-50',
                  'focus:ring-2 focus:ring-primary/30 focus:outline-none',
                  !selectedDate && 'text-muted-foreground',
                  selectedDate && 'border-primary/30 bg-primary/5'
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5" />
                <span className="text-base">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Slots */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">
            Preferred Time
          </Label>
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4"
            role="radiogroup"
            aria-label="Time slot selection"
          >
            {timeSlots.map((time) => {
              const isSelected = state.time === time;
              return (
                <motion.button
                  key={time}
                  type="button"
                  onClick={() => handleTimeSelect(time)}
                  className={cn(
                    'relative rounded-xl border-2 p-3 min-h-[52px] font-medium text-sm transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30',
                    isSelected
                      ? 'bg-primary/6 ring-2 ring-primary shadow-md border-primary'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{time}</span>
                  </div>
                  
                  {/* Selected Check Mark */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Frequency Selector */}
        <FrequencySelector
          value={state.frequency}
          onChange={(frequency) => updateField('frequency', frequency)}
          discounts={discounts}
        />

        {/* Confirmation Box */}
        <AnimatePresence>
          {state.date && state.time && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Appointment Scheduled
                  </h3>
                  <p className="text-sm text-gray-700">
                    {format(selectedDate!, 'EEEE, MMMM d, yyyy')} at <span className="font-semibold">{state.time}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          <span className="hidden sm:inline">Back to Details</span>
        </Button>
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
          <span className="hidden sm:inline">Continue to Contact</span>
        </Button>
      </div>
    </motion.div>
  );
}

