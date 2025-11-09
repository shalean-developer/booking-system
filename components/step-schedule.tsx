'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfToday, startOfDay, addDays, isValid, differenceInCalendarDays } from 'date-fns';
import { Check, Clock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { generateTimeSlots, getCurrentPricing, calcTotalAsync } from '@/lib/pricing';
import { FrequencySelector } from '@/components/frequency-selector';
import { supabase } from '@/lib/supabase-client';

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
  const searchParams = useSearchParams();
  const rescheduleId = searchParams.get('rescheduleId');
  const rebookId = searchParams.get('rebookId');
  const { state, updateField } = useBooking();
  const [discounts, setDiscounts] = useState<{ [key: string]: number }>({});
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [customDateValue, setCustomDateValue] = useState<string>('');
  const dateCardsRef = useRef<HTMLDivElement>(null);
  const firstDateCardRef = useRef<HTMLButtonElement | null>(null);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  const [frequencyPricing, setFrequencyPricing] = useState<
    Record<'one-time' | 'weekly' | 'bi-weekly' | 'monthly', {
      total: number;
      subtotal: number;
      frequencyDiscountPercent: number;
    }>
  >();

  const today = useMemo(() => startOfToday(), []);
  const isReschedule = useMemo(() => Boolean(rescheduleId), [rescheduleId]);
  const isRebook = useMemo(() => Boolean(rebookId), [rebookId]);

  const normalizedSelectedDate = useMemo(() => {
    if (state.date) {
      const parsed = startOfDay(parseISO(state.date));
      if (!isReschedule && !isRebook && parsed < today) {
        return today;
      }
      return parsed;
    }
    return today;
  }, [state.date, today, isReschedule, isRebook]);

  const selectedDate = useMemo(() => state.date ? parseISO(state.date) : undefined, [state.date]);

  const canNavigateLeft = useMemo(() => {
    if (visibleDates.length === 0) return false;
    return visibleDates[0] > today;
  }, [visibleDates, today]);

  // Initialize visible dates - show 7 dates starting from selected date or today
  useEffect(() => {
    const diffFromToday = differenceInCalendarDays(normalizedSelectedDate, today);
    const anchor =
      normalizedSelectedDate < today
        ? today
        : diffFromToday >= 0 && diffFromToday <= 6
          ? today
          : normalizedSelectedDate;

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(anchor, i));
    }
    setVisibleDates(dates);
    setCustomDateValue(format(normalizedSelectedDate < today ? today : normalizedSelectedDate, 'yyyy-MM-dd'));
  }, [normalizedSelectedDate, today]);

  useEffect(() => {
    if (dateCardsRef.current && firstDateCardRef.current) {
      const container = dateCardsRef.current;
      const firstCard = firstDateCardRef.current;
      const offset = firstCard.offsetLeft - container.clientWidth * 0.15;
      container.scrollLeft = offset > 0 ? offset : 0;
    }
  }, [visibleDates]);

  const navigateDates = useCallback((direction: 'left' | 'right') => {
    setScrollDirection(direction);
    
    if (dateCardsRef.current) {
      const container = dateCardsRef.current;
      const firstCard = container.querySelector<HTMLButtonElement>('button[data-date-card]');
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth + 12; // card width + gap
        container.scrollBy({
          left: direction === 'right' ? cardWidth : -cardWidth,
          behavior: 'smooth'
        });
      }
    }

    setVisibleDates(prev => {
      if (prev.length === 0) return prev;

      const offset = direction === 'right' ? 1 : -1;
      const newDates: Date[] = [];

      for (let i = 0; i < 7; i++) {
        const base = prev[0];
        const date = new Date(base);
        date.setDate(base.getDate() + offset + i);
        if (date >= today) {
          newDates.push(date);
        }
      }

      return newDates.length === 7 ? newDates : prev;
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

  // Prefill booking details when rebooking to skip earlier steps
  useEffect(() => {
    const loadPreviousBooking = async () => {
      if (!rebookId) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const resp = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(rebookId)}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const json = await resp.json();
        if (resp.ok && json.ok && json.booking) {
          const b = json.booking as any;
          // Service
          updateField('service', b.service_type);
          // Property
          updateField('bedrooms', b.bedrooms || 0);
          updateField('bathrooms', b.bathrooms || 1);
          const extrasFromBooking = Array.isArray(b.extras) ? b.extras : [];
          updateField('extras', extrasFromBooking);
          const extraCounts = extrasFromBooking.reduce<Record<string, number>>((acc, extra) => {
            acc[extra] = (acc[extra] || 0) + 1;
            return acc;
          }, {});
          updateField('extrasQuantities', extraCounts);
          updateField('notes', b.notes || '');
          // Contact
          const name = (b.customer_name || '').split(' ');
          updateField('firstName', name[0] || '');
          updateField('lastName', name.slice(1).join(' ') || '');
          updateField('email', b.customer_email || '');
          updateField('phone', b.customer_phone || '');
          // Address
          updateField('address', {
            line1: b.address_line1 || '',
            suburb: b.address_suburb || '',
            city: b.address_city || ''
          });
        }
      } catch {
        // ignore
      }
    };

    loadPreviousBooking();
  }, [rebookId, updateField]);

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
          extrasQuantities: state.extrasQuantities,
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
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.extrasQuantities, state.frequency]);

  useEffect(() => {
    let cancelled = false;

    const loadPricing = async () => {
      if (!state.service || state.bathrooms < 1) {
        setFrequencyPricing(undefined);
        return;
      }

      const input = {
        service: state.service,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        extras: state.extras || [],
        extrasQuantities: state.extrasQuantities,
      };

      try {
        const frequencies: Array<'one-time' | 'weekly' | 'bi-weekly' | 'monthly'> = [
          'one-time',
          'weekly',
          'bi-weekly',
          'monthly',
        ];

        const results = await Promise.all(
          frequencies.map(async (freq) => {
            const summary = await calcTotalAsync(input, freq);
            return {
              frequency: freq,
              total: summary.total,
              subtotal: summary.subtotal + summary.serviceFee,
              frequencyDiscountPercent: summary.frequencyDiscountPercent,
            };
          })
        );

        if (!cancelled) {
          setFrequencyPricing(
            results.reduce((acc, item) => {
              acc[item.frequency] = {
                total: item.total,
                subtotal: item.subtotal,
                frequencyDiscountPercent: item.frequencyDiscountPercent,
              };
              return acc;
            }, {} as Record<'one-time' | 'weekly' | 'bi-weekly' | 'monthly', {
              total: number;
              subtotal: number;
              frequencyDiscountPercent: number;
            }>)
          );
        }
      } catch (error) {
        console.warn('Failed to load frequency pricing preview', error);
        if (!cancelled) {
          setFrequencyPricing(undefined);
        }
      }
    };

    loadPricing();

    return () => {
      cancelled = true;
    };
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.extrasQuantities]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      updateField('date', format(date, 'yyyy-MM-dd'));
    }
  }, [updateField]);

  const handleTimeSelect = useCallback((time: string) => {
    updateField('time', time);
  }, [updateField]);

  const handleCustomDateChange = useCallback((value: string) => {
    if (!value) return;

    const parsed = parseISO(value);
    if (!isValid(parsed)) return;

    const normalized = startOfDay(parsed);
    const base = normalized < today ? today : normalized;

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(base, i));
    }

    setVisibleDates(dates);
    handleDateSelect(base);
    setCustomDateValue(format(base, 'yyyy-MM-dd'));
  }, [handleDateSelect, today]);

  const canProceed = useMemo(() => 
    state.date !== null && state.time !== null, 
    [state.date, state.time]
  );

  useEffect(() => {
    if (isReschedule || isRebook) return;

    const normalizedStr = format(normalizedSelectedDate, 'yyyy-MM-dd');
    if (state.date !== normalizedStr) {
      updateField('date', normalizedStr);
    }
  }, [state.date, updateField, normalizedSelectedDate, isReschedule, isRebook]);

  const groupedTimeSlots = useMemo(() => {
    const groups: { label: string; slots: string[] }[] = [
      { label: 'Early morning (7:00 – 8:30)', slots: [] },
      { label: 'Mid-morning (9:00 – 10:30)', slots: [] },
      { label: 'Midday (11:00 – 12:30)', slots: [] },
      { label: 'Early afternoon (13:00)', slots: [] },
    ];

    timeSlots.forEach((slot) => {
      const [hourStr, minuteStr] = slot.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const timeValue = hour + minute / 60;

      if (timeValue < 9) {
        groups[0].slots.push(slot);
      } else if (timeValue < 11) {
        groups[1].slots.push(slot);
      } else if (timeValue < 12.5) {
        groups[2].slots.push(slot);
      } else {
        groups[3].slots.push(slot);
      }
    });

    return groups.filter((group) => group.slots.length > 0);
  }, []);

  const isSelectedDateToday = useMemo(() => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  }, [selectedDate, today]);

  const hasFutureSlots = useMemo(() => {
    if (!selectedDate) return true;
    if (!isSelectedDateToday) return true;
    const now = new Date();

    return groupedTimeSlots.some((group) =>
      group.slots.some((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        return slotTime >= now;
      })
    );
  }, [groupedTimeSlots, isSelectedDateToday, selectedDate]);

  const handleBack = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/details`);
    }
  }, [state.service, router]);

  const handleNext = useCallback(async () => {
    if (!state.service) return;
    // If rescheduling, update existing booking and go back to dashboard bookings
    if (rescheduleId && state.date && state.time) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const resp = await fetch('/api/dashboard/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ bookingId: rescheduleId, date: state.date, time: state.time })
      });
      // On success navigate back to bookings, otherwise stay here
      if (resp.ok) {
        const json = await resp.json();
        if (json.ok) {
          router.push('/dashboard/bookings');
          return;
        }
      }
      return; // Do not proceed to contact during reschedule flow
    }
    const slug = serviceTypeToSlug(state.service);
    if (rebookId) {
      router.push(`/booking/service/${slug}/review?rebookId=${encodeURIComponent(rebookId)}`);
      return;
    }
    router.push(`/booking/service/${slug}/contact`);
  }, [state.service, state.date, state.time, rescheduleId, rebookId, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
    >
      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <CalendarDays className="h-3.5 w-3.5" />
          Step 2 of 3 · Schedule & Contact
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Choose your schedule
        </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl">
            Pick a date and arrival window that suits you. We’ll confirm the exact arrival time once your cleaner is assigned.
        </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-10">
        {/* Date Picker */}
        <section className="space-y-4" aria-labelledby="preferred-date">
          <div className="flex flex-col gap-1">
            <Label id="preferred-date" htmlFor="date-picker" className="text-sm font-semibold text-gray-900">
              Preferred date
          </Label>
            <p className="text-sm text-gray-600">
              We show the next 7 days in view. Need something specific? Pick a custom date or reach out after booking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-date-picker" className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Jump to a date
              </Label>
              <input
                id="custom-date-picker"
                type="date"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                value={customDateValue}
                min={format(today, 'yyyy-MM-dd')}
                onChange={(event) => handleCustomDateChange(event.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">
              Use Earlier/Later to browse a week at a time or jump directly with the date picker.
            </p>
          </div>
          
          {/* Horizontal Date Selector */}
          <div className="flex items-center gap-3 justify-center">
            {/* Left Arrow */}
            <button
              type="button"
              onClick={() => navigateDates('left')}
              disabled={!canNavigateLeft}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-primary/40 hover:text-primary",
                !canNavigateLeft && "opacity-40 cursor-not-allowed hover:border-gray-200 hover:text-gray-600"
              )}
              aria-label="Previous dates"
            >
              <ChevronLeft className="h-5 w-5 text-gray-900" />
              <span className="hidden md:inline">Earlier</span>
            </button>

            {/* Date Cards */}
            <div
              ref={dateCardsRef}
              className="flex gap-3 flex-1 justify-center overflow-x-auto relative scrollbar-hide py-3 pl-14 pr-4"
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
                      key={visibleDates.map((d) => d.toISOString()).join(',')}
                      initial={getInitial()}
                      animate={{ x: 0, opacity: 1 }}
                      exit={getExit()}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="flex gap-2"
                    >
                      <div className="hidden lg:flex items-center ml-20">
                        <div className="flex flex-col items-center justify-center rounded-lg px-5 py-3 min-w-[104px] bg-primary text-white shadow-md">
                          <span className="text-sm font-bold uppercase tracking-wide">Today</span>
                          <span className="text-sm font-medium mt-1 whitespace-nowrap">{format(today, 'MMM d')}</span>
                          <span className="mt-1 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                            {format(today, 'EEE')}
                          </span>
                        </div>
                      </div>
                      {visibleDates.map((date, index) => {
                        const isSelected =
                          selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        const isToday = date.getTime() === today.getTime();
                        const isDisabled = date < today;

                        return (
                          <button
                            key={date.toISOString()}
                            type="button"
                            ref={index === 0 ? firstDateCardRef : null}
                            onClick={() => !isDisabled && handleDateSelect(date)}
                            disabled={isDisabled}
                            data-date-card
                            className={cn(
                              'flex flex-col items-center justify-center rounded-lg px-5 py-3 min-w-[104px] transition-all',
                              'focus:outline-none focus:ring-2 focus:ring-primary/30',
                              isSelected
                                ? 'bg-[#D0EEF2] text-gray-900'
                                : isToday
                                ? 'bg-blue-50 border-2 border-blue-400 text-gray-900 hover:border-blue-500'
                                : 'bg-white border border-[#E0E0E0] text-gray-900 hover:border-gray-300',
                              isDisabled && 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                            )}
                          >
                            <span className="text-sm font-bold whitespace-nowrap">{format(date, 'EEE')}</span>
                            <span className="text-sm font-medium mt-1 whitespace-nowrap">{format(date, 'MMM d')}</span>
                            {isToday && (
                              <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                                Today
                              </span>
                            )}
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
              className="flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Next dates"
            >
              <span className="hidden md:inline">Later</span>
              <ChevronRight className="h-5 w-5 text-gray-900" />
            </button>
          </div>
        </section>

        {/* Time Slots */}
        <section className="space-y-4" aria-labelledby="preferred-time">
          <div className="flex flex-col gap-1">
            <Label id="preferred-time" className="text-sm font-semibold text-gray-900">
              Preferred arrival window
          </Label>
            <p className="text-sm text-gray-600">
              Choose a start time. Your cleaner may arrive up to 30 minutes either side to allow for traffic.
            </p>
          </div>

          <div className="space-y-5">
            {groupedTimeSlots.map((group) => {
              const now = isSelectedDateToday ? new Date() : null;
              const visibleSlots = group.slots.filter((time) => {
                if (!isSelectedDateToday || !now) return true;
                const [hours, minutes] = time.split(':').map(Number);
                const slotTime = new Date();
                slotTime.setHours(hours, minutes, 0, 0);
                return slotTime >= now;
              });

              if (visibleSlots.length === 0) {
                return null;
              }

              return (
                <div key={group.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {group.label}
                    </h3>
                  </div>
                  <div 
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4"
                    role="radiogroup"
                    aria-label={`${group.label} time slots`}
                  >
                    {visibleSlots.map((time) => {
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
                              : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'
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
              );
            })}
          </div>

          {hasFutureSlots && (
            <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Time slots update live—once a start time passes, it disappears from the list.
              </p>
              <p>
                We’ll confirm the final arrival within ±30 minutes once your cleaner is assigned.
              </p>
            </div>
          )}
        </section>

        {/* Frequency Selector */}
        <FrequencySelector
          value={state.frequency}
          onChange={(frequency) => updateField('frequency', frequency)}
          discounts={discounts}
          pricingByFrequency={frequencyPricing}
        />
      </div>

      {/* Navigation */}
      <div className="mt-8 space-y-3 border-t pt-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button 
            variant="ghost" 
          onClick={handleBack} 
          size="lg" 
          className={cn(
              "rounded-full px-4 font-semibold text-slate-600 hover:text-primary",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
              "transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start"
          )}
          type="button"
        >
            Back to details
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed} 
          size="lg" 
          className={cn(
              "rounded-full px-8 py-3 font-semibold shadow-lg w-full sm:w-auto justify-center",
            "bg-primary hover:bg-primary/90 text-white",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          type="button"
        >
            Continue to contact
        </Button>
        </div>
        {!canProceed && (
          <p className="text-xs text-amber-600">
            Select both a date and time slot to continue.
          </p>
        )}
      </div>
    </motion.div>
  );
}

