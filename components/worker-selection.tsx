'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, Star, MapPin, Calendar, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { PopoverDatePicker } from '@/components/ui/popover-date-picker';
import { PopoverTimeSelect } from '@/components/ui/popover-time-select';
import { supabase } from '@/lib/supabase-client';
import type { Cleaner, AvailableCleanersResponse } from '@/types/booking';
import { requiresTeam } from '@/lib/booking-utils';

// Frequency options
const FREQUENCY_OPTIONS = [{
  id: 'one-time',
  label: 'One-Time',
  icon: Home,
  subtitle: 'Single booking',
  discount: ''
}, {
  id: 'weekly',
  label: 'Weekly',
  icon: Calendar,
  subtitle: 'Every week',
  discount: 'Save 15%'
}, {
  id: 'bi-weekly',
  label: 'Bi-Weekly',
  icon: Calendar,
  subtitle: 'Every 2 weeks',
  discount: 'Save 10%'
}, {
  id: 'monthly',
  label: 'Monthly',
  icon: Calendar,
  subtitle: 'Once a month',
  discount: 'Save 5%'
}] as const;

const CleanerCard = ({
  cleaner,
  isSelected,
  onClick
}: {
  cleaner: Cleaner;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const initial = cleaner.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const reliability = Math.round(cleaner.completion_rate ?? 0); // Fetch from database and round to whole number
  
  return (
    <div 
      onClick={onClick} 
      className={cn(
        "relative bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md", 
        isSelected ? "border-blue-600 shadow-md" : "border-gray-100"
      )}
      style={{
        width: "176px",
        maxWidth: "176px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
          Available
        </span>
      </div>

      <div className="flex items-start gap-3 mb-3" style={{ flexDirection: "column" }}>
        {cleaner.photo_url ? (
          <img 
            src={cleaner.photo_url} 
            alt={cleaner.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-slate-900 truncate">{cleaner.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-slate-700">{(cleaner.rating ?? 0).toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-blue-600">Reliability</span>
            <span className="text-[11px] font-bold text-slate-700">{reliability}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${reliability}%` }} />
          </div>
        </div>

        {cleaner.years_experience && (
          <p className="text-[11px] text-slate-500 leading-tight line-clamp-2 mt-2">
            {cleaner.years_experience} year{cleaner.years_experience !== 1 ? 's' : ''} experience
          </p>
        )}
      </div>
    </div>
  );
};

export const WorkerSelection = () => {
  const { state, updateField } = useBookingV2();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rescheduleId = searchParams.get('rescheduleId');
  const { getDetailsPath, getReviewPath } = useBookingPath();
  
  const [selectedCleaner, setSelectedCleaner] = useState<string | null>(state.cleaner_id || null);
  const [frequency, setFrequency] = useState<string>(state.frequency || 'one-time');
  const [sortBy, setSortBy] = useState<string>('best-match');
  
  // Step state - track whether we're on schedule/address or cleaner/frequency step
  const [currentStep, setCurrentStep] = useState<'schedule' | 'cleaner'>('schedule');
  
  // Cleaner state
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoadingCleaners, setIsLoadingCleaners] = useState(false);
  const [cleanerError, setCleanerError] = useState<string | null>(null);
  
  const needsTeamByService = requiresTeam(state.service);
  const multiCleanerStandardAirbnb =
    (state.service === 'Standard' || state.service === 'Airbnb') &&
    Math.max(1, Math.round(state.numberOfCleaners ?? 1)) > 1;

  // Load booking data when rescheduling
  useEffect(() => {
    const loadBookingForReschedule = async () => {
      if (!rescheduleId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const resp = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(rescheduleId)}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        const json = await resp.json();

        if (resp.ok && json.ok && json.booking) {
          const b = json.booking as any;
          // Address
          updateField('address', {
            line1: b.address_line1 || '',
            suburb: b.address_suburb || '',
            city: b.address_city || ''
          });
          // Date and time
          if (b.booking_date) {
            updateField('date', b.booking_date);
          }
          if (b.booking_time) {
            updateField('time', b.booking_time);
          }
        }
      } catch {
        // ignore errors - user can still reschedule manually
      }
    };

    loadBookingForReschedule();
  }, [rescheduleId, updateField]);

  // Fetch cleaners when date and suburb are available (with debouncing)
  useEffect(() => {
    const abortController = new AbortController();

    const fetchCleaners = async () => {
      if (needsTeamByService || multiCleanerStandardAirbnb) {
        setIsLoadingCleaners(false);
        return;
      }

      // Use suburb if available, otherwise fall back to city
      const location = state.address.suburb || state.address.city;

      if (!state.date || !location) {
        setIsLoadingCleaners(false);
        setCleaners([]);
        return;
      }

      try {
        setIsLoadingCleaners(true);
        setCleanerError(null);

        const params = new URLSearchParams({
          date: state.date || '',
          city: location,
          suburb: state.address.suburb || '',
        });
        if (state.time) {
          params.set('time', state.time);
        }

        const response = await fetch(`/api/cleaners/available?${params}`, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          return;
        }

        const data: AvailableCleanersResponse = await response.json();

        if (abortController.signal.aborted) {
          return;
        }

        if (data.ok) {
          setCleaners(data.cleaners);
        } else {
          setCleanerError(data.error || 'Failed to fetch cleaners');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        if (!abortController.signal.aborted) {
          setCleanerError('Failed to load available cleaners');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingCleaners(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      fetchCleaners();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [state.date, state.time, state.address.suburb, state.address.city, needsTeamByService, multiCleanerStandardAirbnb]);

  const sortedCleaners = useMemo(() => {
    let list = [...cleaners];

    switch (sortBy) {
      case 'rating':
        list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'experience':
        list.sort((a, b) => (b.years_experience ?? 0) - (a.years_experience ?? 0));
        break;
      default:
        // Best match: rating first, then experience
        list.sort((a, b) => {
          const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.years_experience ?? 0) - (a.years_experience ?? 0);
        });
        break;
    }

    return list;
  }, [cleaners, sortBy]);

  const handleSelectCleaner = useCallback((cleanerId: string) => {
    setSelectedCleaner(cleanerId);
    updateField('cleaner_id', cleanerId);
    
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (cleaner) {
      updateField('selectedCleaner', {
        id: cleaner.id,
        name: cleaner.name,
        photo_url: cleaner.photo_url || null,
        rating: cleaner.rating || 0,
        years_experience: cleaner.years_experience ?? undefined,
      });
    }
  }, [updateField, cleaners]);

  const handleFrequencyChange = useCallback((freq: string) => {
    setFrequency(freq);
    updateField('frequency', freq as 'one-time' | 'weekly' | 'bi-weekly' | 'monthly');
  }, [updateField]);

  const handleBack = useCallback(() => {
    // If on cleaner step, go back to schedule step
    if (currentStep === 'cleaner') {
      setCurrentStep('schedule');
      return;
    }
    // If on schedule step, navigate to details page
    if (state.service) {
      router.push(getDetailsPath(state.service));
    }
  }, [currentStep, state.service, router, getDetailsPath]);

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
    
    router.push(getReviewPath(state.service));
  }, [state.service, state.date, state.time, rescheduleId, router, getReviewPath]);

  const canProceed = useMemo(() => {
    // On schedule step, require date and time
    if (currentStep === 'schedule') {
      return state.date !== null && state.time !== null;
    }
    // On cleaner step, require date and time (cleaner selection is optional)
    return state.date !== null && state.time !== null;
  }, [currentStep, state.date, state.time]);

  return (
    <div className="space-y-6">
      {/* Schedule & Cleaner Section */}
      <div className="rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Schedule & Cleaner</h2>
        <p className="text-sm text-slate-500 mb-6">Choose your preferred date and time.</p>

        {/* Schedule Section */}
        {currentStep === 'schedule' && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Schedule
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pick a date</label>
                <div className="relative">
                  <PopoverDatePicker
                    value={state.date || ''}
                    onValueChange={(value) => updateField('date', value)}
                    placeholder="yyyy/mm/dd"
                    minDate={new Date()}
                    className="relative pl-10"
                  />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select time</label>
                <PopoverTimeSelect
                  value={state.time || ''}
                  onValueChange={(value) => updateField('time', value)}
                  stepMinutes={30}
                  startHour={7}
                  endHour={18}
                />
              </div>
            </div>
          </div>
        )}

        {/* Service Address */}
        {currentStep === 'schedule' && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">Service Address</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address <span className="text-red-500">*</span>
              </label>
              <AddressAutocomplete
                value={state.address.line1 || ''}
                onChange={(address) => {
                  updateField('address', {
                    ...state.address,
                    line1: address.line1,
                    suburb: address.suburb || state.address.suburb,
                    city: address.city || state.address.city,
                  });
                }}
                onInputChange={(value) => {
                  updateField('address', {
                    ...state.address,
                    line1: value,
                  });
                }}
                placeholder="e.g. 123 Nelson Mandela Avenue"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Apt / Unit</label>
              <input
                type="text"
                placeholder="e.g., Apt 4B, Unit 12"
                value={state.address.line2 || ''}
                onChange={(e) => updateField('address', { ...state.address, line2: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Suburb <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={state.address.suburb || ''}
                onChange={(e) => updateField('address', { ...state.address, suburb: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={state.address.city || ''}
                onChange={(e) => updateField('address', { ...state.address, city: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        )}

        {/* Continue Button - shown after address when on schedule step */}
        {currentStep === 'schedule' && (
          <div className="flex justify-end mt-6">
            <button
              onClick={() => {
                // Validate required fields before proceeding
                if (state.date && state.time && state.address.line1 && state.address.suburb && state.address.city) {
                  setCurrentStep('cleaner');
                }
              }}
              disabled={!state.date || !state.time || !state.address.line1 || !state.address.suburb || !state.address.city}
              className={cn(
                "flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200",
                (!state.date || !state.time || !state.address.line1 || !state.address.suburb || !state.address.city) && "opacity-50 cursor-not-allowed"
              )}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Back Button - shown when on cleaner step */}
        {currentStep === 'cleaner' && (
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep('schedule')}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Schedule & Address
            </button>
          </div>
        )}

        {/* Select Cleaner */}
        {currentStep === 'cleaner' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Select your preferred cleaner</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-medium text-slate-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="best-match">Best Match</option>
                <option value="rating">Highest Rating</option>
                <option value="experience">Most Experience</option>
              </select>
            </div>
          </div>

          {/* Cleaner Grid */}
          {isLoadingCleaners ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : cleanerError ? (
            <div className="text-center py-8 text-red-500 text-sm">{cleanerError}</div>
          ) : cleaners.length === 0 ? (
            state.date && (state.address.suburb || state.address.city) ? (
              <div>
                {/* No preference option - only show when no cleaners available */}
                <button
                  onClick={() => {
                    setSelectedCleaner(null);
                    updateField('cleaner_id', null);
                    updateField('selectedCleaner', null);
                  }}
                  className={cn(
                    "w-full rounded-xl border-2 border-dashed p-4 text-center transition-all",
                    !selectedCleaner
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Home className="w-6 h-6 text-gray-400" />
                    <span className="text-sm font-semibold text-slate-700">No preference / Best available</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Select a date and location to see available cleaners.
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedCleaners.map(cleaner => (
                <CleanerCard
                  key={cleaner.id}
                  cleaner={cleaner}
                  isSelected={selectedCleaner === cleaner.id}
                  onClick={() => handleSelectCleaner(cleaner.id)}
                />
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Frequency Section - only show when on cleaner step */}
        {currentStep === 'cleaner' && (state.service === 'Standard' || state.service === 'Airbnb') && (
        <div className="rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">How often do you need cleaning?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FREQUENCY_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleFrequencyChange(option.id)}
                  className={cn(
                    "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all bg-white",
                    frequency === option.id ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                    frequency === option.id ? "bg-blue-100" : "bg-gray-50"
                  )}>
                    <Icon className={cn("w-5 h-5", frequency === option.id ? "text-blue-600" : "text-gray-400")} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                  <span className="text-xs text-gray-600">{option.subtitle}</span>
                  {option.discount && (
                    <span className="text-[10px] font-semibold text-green-600 mt-1">
                      {option.discount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation - only show when on cleaner step */}
      {currentStep === 'cleaner' && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={cn(
              "flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200",
              !canProceed && "opacity-50 cursor-not-allowed"
            )}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
