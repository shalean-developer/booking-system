'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateTimeSlots, getCurrentPricing, calcTotalAsync } from '@/lib/pricing';
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
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const dateCardsRef = useRef<HTMLDivElement>(null);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);

  const selectedDate = useMemo(() => 
    state.date ? new Date(state.date) : undefined, 
    [state.date]
  );

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const canNavigateLeft = useMemo(() => {
    if (visibleDates.length === 0) return false;
    return visibleDates[0] > today;
  }, [visibleDates, today]);

  // Initialize visible dates - show 7 dates starting from today (complete week)
  useEffect(() => {
    const dates: Date[] = [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() + i);
      dates.push(date);
    }
    
    setVisibleDates(dates);
  }, []);

  const navigateDates = useCallback((direction: 'left' | 'right') => {
    setScrollDirection(direction);
    setVisibleDates(prev => {
      if (prev.length === 0) return prev;
      
      const newDates: Date[] = [];
      const firstDate = prev[0];
      
      // Don't allow scrolling left if we're already at or before today
      if (direction === 'left' && firstDate <= today) {
        return prev;
      }
      
      const offset = direction === 'right' ? 7 : -7;
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDate);
        date.setDate(firstDate.getDate() + offset + i);
        // Don't allow dates before today
        if (date >= today) {
          newDates.push(date);
        }
      }
      
      return newDates.length > 0 ? newDates : prev;
    });
  }, [today]);

  // Reset scroll direction after animation completes
  useEffect(() => {
    if (scrollDirection) {
      const timer = setTimeout(() => {
        setScrollDirection(null);
      }, 350); // Slightly longer than animation duration
      
      return () => clearTimeout(timer);
    }
  }, [scrollDirection]);

  // Fetch frequency discounts and pre-fetch pricing in parallel (optimization)
  useEffect(() => {
    // Fetch discounts on mount
    getCurrentPricing().then((pricing) => {
      setDiscounts(pricing.frequencyDiscounts);
    }).catch((error) => {
      console.error('Failed to fetch frequency discounts:', error);
    });
  }, []);

  // Pre-fetch pricing while user is selecting schedule (optimization)
  useEffect(() => {
    if (state.service && state.bathrooms >= 1) {
      // Pre-calculate pricing and cache it for the review step
      // This runs in parallel with discount fetching for better performance
      calcTotalAsync(
        {
          service: state.service,
          bedrooms: state.bedrooms,
          bathrooms: state.bathrooms,
          extras: state.extras || [],
        },
        state.frequency || 'one-time'
      ).then((details) => {
        // Store in sessionStorage for instant loading on review step
        try {
          sessionStorage.setItem('cached_pricing', JSON.stringify({
            ...details,
            timestamp: Date.now(),
          }));
        } catch (err) {
          console.warn('Failed to cache pricing:', err);
        }
      }).catch((error) => {
        console.warn('Failed to pre-fetch pricing:', error);
      });
    }
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.frequency]);

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
          
          {/* Horizontal Date Selector */}
          <div className="flex items-center gap-3 justify-center">
            {/* Left Arrow */}
            <button
              type="button"
              onClick={() => navigateDates('left')}
              disabled={!canNavigateLeft}
              className={cn(
                "flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors",
                !canNavigateLeft && "opacity-30 cursor-not-allowed"
              )}
              aria-label="Previous dates"
            >
              <ChevronLeft className="h-5 w-5 text-gray-900" />
            </button>

            {/* Date Cards */}
            <div 
              ref={dateCardsRef}
              className="flex gap-2 flex-1 justify-center overflow-x-hidden relative"
            >
              <AnimatePresence mode="wait">
                {(() => {
                  const getInitial = () => {
                    if (scrollDirection === 'right') return { x: 616, opacity: 0 };
                    if (scrollDirection === 'left') return { x: -616, opacity: 0 };
                    return undefined;
                  };
                  
                  const getExit = () => {
                    if (scrollDirection === 'right') return { x: -616, opacity: 0 };
                    if (scrollDirection === 'left') return { x: 616, opacity: 0 };
                    return undefined;
                  };
                  
                  return (
                    <motion.div
                      key={visibleDates.map(d => d.toISOString()).join(',')}
                      initial={getInitial()}
                      animate={{ x: 0, opacity: 1 }}
                      exit={getExit()}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="flex gap-2"
                    >
                      {visibleDates.map((date) => {
                    const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const isDisabled = date < today;
                    
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => !isDisabled && handleDateSelect(date)}
                        disabled={isDisabled}
                        className={cn(
                          'flex flex-col items-center justify-center rounded-lg p-3 min-w-[80px] transition-all',
                          'focus:outline-none focus:ring-2 focus:ring-primary/30',
                          isSelected
                            ? 'bg-[#D0EEF2] text-gray-900'
                            : 'bg-white border border-[#E0E0E0] text-gray-900 hover:border-gray-300',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <span className="text-sm font-medium">{format(date, 'EEE')}</span>
                        <span className="text-sm font-medium mt-1">{format(date, 'MMM d')}</span>
                      </button>
                    );
                  })}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>

            {/* Right Arrow */}
            <button
              type="button"
              onClick={() => navigateDates('right')}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Next dates"
            >
              <ChevronRight className="h-5 w-5 text-gray-900" />
            </button>
          </div>
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
                      ? 'bg-primary/10 ring-4 ring-primary shadow-lg border-primary/30'
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

        {/* Confirmation Cards */}
        <AnimatePresence>
          {state.date && state.time && (
            <div className="space-y-3">
              {/* Discount Confirmation - Show only for weekly recurring */}
              {state.frequency === 'weekly' && discounts.weekly && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg border border-blue-200 bg-blue-50 p-4"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-sm font-medium text-blue-900">
                    Great choice! You'll save {discounts.weekly}% on recurring weekly service.
                  </p>
                </motion.div>
              )}

              {/* Appointment Confirmation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-gray-200 bg-white p-4"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
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
            </div>
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

