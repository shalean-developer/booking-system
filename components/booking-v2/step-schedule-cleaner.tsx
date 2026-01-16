'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Loader2, UserX, AlertCircle, Sparkles, CheckCircle, User, MapPin, Heart } from 'lucide-react';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { getCurrentPricing } from '@/lib/pricing';
import { FrequencySelector } from '@/components/frequency-selector';
import type { Cleaner, AvailableCleanersResponse, TeamName } from '@/types/booking';
import { requiresTeam } from '@/lib/booking-utils';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-client';


export function StepScheduleCleaner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rescheduleId = searchParams.get('rescheduleId');
  const { state, updateField } = useBookingV2();
  const { getDetailsPath, getReviewPath } = useBookingPath();
  
  // Schedule state
  const [discounts, setDiscounts] = useState<{ [key: string]: number }>({});
  const [frequencyPricing, setFrequencyPricing] = useState<
    Record<'one-time' | 'weekly' | 'bi-weekly' | 'monthly', {
      total: number;
      subtotal: number;
      frequencyDiscountPercent: number;
    }>
  >();

  // Cleaner state
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoadingCleaners, setIsLoadingCleaners] = useState(false);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(state.cleaner_id);
  const [favoriteCleanerIds, setFavoriteCleanerIds] = useState<Set<string>>(new Set());
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);
  const initialTeam = useMemo<TeamName | null>(() => {
    const teamValue = state.selected_team;
    const validTeams: TeamName[] = ['Team A', 'Team B', 'Team C'];
    return validTeams.includes(teamValue as TeamName) ? (teamValue as TeamName) : null;
  }, [state.selected_team]);
  const [selectedTeam, setSelectedTeam] = useState<TeamName | null>(initialTeam);
  const [cleanerError, setCleanerError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'recommended' | 'rating' | 'experience'>('recommended');
  
  // Team availability state
  const [bookedTeams, setBookedTeams] = useState<Set<TeamName>>(new Set());
  const [isLoadingTeamAvailability, setIsLoadingTeamAvailability] = useState(false);

  const needsTeamByService = requiresTeam(state.service);
  const multiCleanerStandardAirbnb =
    (state.service === 'Standard' || state.service === 'Airbnb') &&
    Math.max(1, Math.round(state.numberOfCleaners ?? 1)) > 1;

  // Load user favorites immediately on mount (non-blocking)
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/dashboard/favorites', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();
        if (response.ok && data.ok && data.favorites) {
          const favoriteIds = new Set<string>(data.favorites.map((fav: any) => fav.cleaner_id as string));
          setFavoriteCleanerIds(favoriteIds);
        }
      } catch (err) {
        // Silently fail - favorites are optional
      }
    };

    loadFavorites();
  }, []);

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
    // Abort controller for cleanup
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
        setCleaners([]); // Clear cleaners when date/location not available
        return; // Don't show error, just wait for date/location
      }

      try {
        setIsLoadingCleaners(true);
        setCleanerError(null);

        const params = new URLSearchParams({
          date: state.date || '',
          city: location, // API accepts 'city' parameter, but we're using suburb value
          suburb: state.address.suburb || '', // Pass suburb as well if available
        });

        const response = await fetch(`/api/cleaners/available?${params}`, {
          signal: abortController.signal,
        });

        // Check if request was aborted
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
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return;
        }
        if (!abortController.signal.aborted) {
          setCleanerError('Failed to load available cleaners');
        }
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoadingCleaners(false);
        }
      }
    };

    // Debounce the fetch to avoid too many rapid requests
    const timeoutId = setTimeout(() => {
      fetchCleaners();
    }, 300); // 300ms debounce

    // Cleanup function to abort ongoing requests and clear timeout
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [state.date, state.address.suburb, state.address.city, needsTeamByService, multiCleanerStandardAirbnb]);

  // Fetch team availability when date changes for Deep/Move In/Out services
  useEffect(() => {
    const abortController = new AbortController();

    const fetchTeamAvailability = async () => {
      if (!needsTeamByService || !state.date || !state.service) {
        setBookedTeams(new Set());
        setIsLoadingTeamAvailability(false);
        return;
      }

      try {
        setIsLoadingTeamAvailability(true);
        setBookedTeams(new Set());

        const params = new URLSearchParams({
          date: state.date,
          service: state.service,
        });

        const response = await fetch(`/api/teams/availability?${params}`, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          return;
        }

        const data = await response.json();

        if (abortController.signal.aborted) {
          return;
        }

        if (data.ok && data.bookedTeams) {
          const bookedSet = new Set<TeamName>(data.bookedTeams);
          setBookedTeams(bookedSet);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        if (!abortController.signal.aborted) {
          console.error('Error fetching team availability:', err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingTeamAvailability(false);
        }
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(() => {
      fetchTeamAvailability();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [state.date, state.service, needsTeamByService]);

  // Reset number of cleaners when service is not Standard/Airbnb
  useEffect(() => {
    if (state.service && state.service !== 'Standard' && state.service !== 'Airbnb') {
      if (state.numberOfCleaners !== 1) {
        updateField('numberOfCleaners', 1);
      }
    }
  }, [state.service, state.numberOfCleaners, updateField]);

  // Ensure multi-cleaner Standard/Airbnb bookings are treated as team bookings (admin assigns multiple cleaners)
  useEffect(() => {
    if (!state.service) return;
    const isStandardAirbnb = state.service === 'Standard' || state.service === 'Airbnb';
    const cleanersCount = Math.max(1, Math.round(state.numberOfCleaners ?? 1));
    if (!isStandardAirbnb) return;

    if (cleanersCount > 1) {
      if (!state.requires_team) {
        updateField('requires_team', true);
      }
      // Clear any single-cleaner selections
      if (state.cleaner_id) {
        updateField('cleaner_id', null);
        updateField('selectedCleaner', null);
        setSelectedCleanerId(null);
      }
      if (state.selected_team) {
        updateField('selected_team', null);
        setSelectedTeam(null);
      }
    } else {
      // Back to single-cleaner mode
      if (state.requires_team && !needsTeamByService) {
        updateField('requires_team', false);
      }
    }
  }, [
    state.service,
    state.numberOfCleaners,
    state.requires_team,
    state.cleaner_id,
    state.selected_team,
    needsTeamByService,
    updateField,
  ]);


  useEffect(() => {
    getCurrentPricing().then((pricing) => {
      setDiscounts(pricing.frequencyDiscounts);
    }).catch(() => {
      // Silently fail - discounts will default to 0
    });
  }, []);

  const handleSelectCleaner = useCallback((cleanerId: string) => {
    setSelectedCleanerId(cleanerId);
    updateField('cleaner_id', cleanerId);
    
    // Store cleaner data to avoid re-fetching in booking summary
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

  const handleSelectTeam = useCallback((teamName: TeamName) => {
    setSelectedTeam(teamName);
    updateField('selected_team', teamName);
    updateField('requires_team', true);
    updateField('cleaner_id', null);
    updateField('selectedCleaner', null);
    setSelectedCleanerId(null);
  }, [updateField]);

  const handleLetUsChoose = useCallback(() => {
    updateField('cleaner_id', null);
    updateField('selectedCleaner', null);
    updateField('selected_team', null);
    setSelectedCleanerId(null);
    setSelectedTeam(null);
  }, [updateField]);

  const canProceed = useMemo(() => 
    state.date !== null && state.time !== null, 
    [state.date, state.time]
  );


  const sortedCleaners = useMemo(() => {
    let list = [...cleaners];

    // Separate favorites and non-favorites
    const favorites: Cleaner[] = [];
    const nonFavorites: Cleaner[] = [];

    list.forEach(cleaner => {
      if (favoriteCleanerIds.has(cleaner.id)) {
        favorites.push(cleaner);
      } else {
        nonFavorites.push(cleaner);
      }
    });

    // Sort each group
    const sortGroup = (group: Cleaner[]) => {
      switch (sortOption) {
        case 'rating':
          return group.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        case 'experience':
          return group.sort((a, b) => (b.years_experience ?? 0) - (a.years_experience ?? 0));
        default:
          return group.sort((a, b) => {
            const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
            if (ratingDiff !== 0) return ratingDiff;
            return (b.years_experience ?? 0) - (a.years_experience ?? 0);
          });
      }
    };

    return [...sortGroup(favorites), ...sortGroup(nonFavorites)];
  }, [cleaners, sortOption, favoriteCleanerIds]);

  const handleToggleFavorite = useCallback(async (cleanerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting cleaner when clicking heart
    
    try {
      setTogglingFavoriteId(cleanerId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // User not logged in - could show a toast or redirect
        return;
      }

      const isFavorite = favoriteCleanerIds.has(cleanerId);
      
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/dashboard/favorites?cleaner_id=${encodeURIComponent(cleanerId)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();
        if (response.ok && data.ok) {
          setFavoriteCleanerIds(prev => {
            const next = new Set(prev);
            next.delete(cleanerId);
            return next;
          });
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/dashboard/favorites', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cleaner_id: cleanerId }),
        });

        const data = await response.json();
        if (response.ok && data.ok) {
          setFavoriteCleanerIds(prev => new Set(prev).add(cleanerId));
        }
      }
    } catch (err) {
      // Silently fail
    } finally {
      setTogglingFavoriteId(null);
    }
  }, [favoriteCleanerIds]);

  const handleBack = useCallback(() => {
    if (state.service) {
      router.push(getDetailsPath(state.service));
    }
  }, [state.service, router, getDetailsPath]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 space-y-10 max-w-[576px] mx-auto"
    >
      {/* Schedule Section */}
      <div className="space-y-10">
        {/* Street Address Section - At the top */}
        <section className="space-y-4" aria-labelledby="street-address">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <h3 id="street-address" className="text-xl font-bold text-gray-900">Service Address</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line1" className="text-sm font-semibold text-gray-900">
              Street Address <span className="text-red-500">*</span>
            </Label>
            <AddressAutocomplete
              id="line1"
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
              placeholder="e.g., 123 Nelson Mandela Avenue"
              className={cn(
                'h-11 rounded-xl border-2 transition-all',
                'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                'hover:border-gray-300'
              )}
              error={false}
            />
          </div>
        </section>

        {/* Number of Cleaners (Standard/Airbnb only) */}
        {(state.service === 'Standard' || state.service === 'Airbnb') && (
          <section className="space-y-3 border-t pt-10" aria-labelledby="number-of-cleaners">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 id="number-of-cleaners" className="text-base font-bold text-gray-900">
                Number of cleaners
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfCleaners" className="text-sm font-semibold text-gray-900">
                Cleaners
              </Label>
              <Select
                value={String(Math.max(1, Math.round(state.numberOfCleaners ?? 1)))}
                onValueChange={(value) => {
                  const next = Math.max(1, parseInt(value, 10) || 1);
                  updateField('numberOfCleaners', next);
                }}
              >
                <SelectTrigger id="numberOfCleaners" className="h-11 rounded-xl border-2">
                  <SelectValue placeholder="Select cleaners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 cleaner</SelectItem>
                  <SelectItem value="2">2 cleaners</SelectItem>
                  <SelectItem value="3">3 cleaners</SelectItem>
                  <SelectItem value="4">4 cleaners</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-600">
                Default is 1 cleaner. If you choose 2+ cleaners, we’ll assign a team for you.
              </p>
            </div>
          </section>
        )}

        {/* Cleaner Selection Section */}
        <section className="space-y-4 border-t pt-10" aria-labelledby="cleaner-selection">
          <h3 id="cleaner-selection" className="text-xl font-bold text-gray-900">
            {needsTeamByService
              ? 'Select your preferred team'
              : multiCleanerStandardAirbnb
                ? 'Cleaner team'
                : 'Select your preferred cleaner'}
          </h3>
          
          {needsTeamByService ? (
            <div className="space-y-4">
              {isLoadingTeamAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : bookedTeams.size === 3 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <AlertCircle className="h-12 w-12 text-orange-500" />
                  <p className="text-gray-600 text-center font-medium">
                    All teams are booked for this date. Please select the next available date.
                  </p>
                  <motion.button
                    onClick={handleLetUsChoose}
                    className={cn(
                      'w-full rounded-xl border-2 border-dashed border-gray-300 p-4 text-center transition-all',
                      'hover:border-primary/40 hover:bg-primary/5',
                      'focus:outline-none focus:ring-2 focus:ring-primary/30'
                    )}
                  >
                    <Sparkles className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">No preference / Best available</p>
                  </motion.button>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                    {(['Team A', 'Team B', 'Team C'] as TeamName[]).map((teamName) => {
                      const isSelected = selectedTeam === teamName;
                      const isBooked = bookedTeams.has(teamName);
                      return (
                        <motion.button
                          key={teamName}
                          onClick={() => !isBooked && handleSelectTeam(teamName)}
                          disabled={isBooked}
                          className={cn(
                            'flex-shrink-0 relative rounded-xl border-2 p-4 min-w-[120px] text-center transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-primary/30',
                            isBooked
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'border-primary bg-primary/5 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'
                          )}
                          whileHover={!isBooked ? { scale: 1.02 } : {}}
                          whileTap={!isBooked ? { scale: 0.98 } : {}}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <h4 className={cn(
                              'font-semibold',
                              isBooked ? 'text-gray-400' : 'text-gray-900'
                            )}>
                              {teamName}
                            </h4>
                            {isBooked && (
                              <span className="text-xs text-gray-500">Booked</span>
                            )}
                            {isSelected && !isBooked && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  <motion.button
                    onClick={handleLetUsChoose}
                    className={cn(
                      'w-full rounded-xl border-2 border-dashed border-gray-300 p-4 text-center transition-all',
                      'hover:border-primary/40 hover:bg-primary/5',
                      'focus:outline-none focus:ring-2 focus:ring-primary/30'
                    )}
                  >
                    <Sparkles className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">No preference / Best available</p>
                  </motion.button>
                </>
              )}
            </div>
          ) : multiCleanerStandardAirbnb ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  {Math.max(1, Math.round(state.numberOfCleaners ?? 1))} cleaners requested
                </p>
                <p className="text-xs text-blue-700">
                  We’ll assign a suitable team for your booking.
                </p>
              </div>
              <Button onClick={handleLetUsChoose} variant="outline" className="w-full">
                No preference / Best available
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoadingCleaners ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : cleanerError ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <p className="text-gray-600 text-center">{cleanerError}</p>
                  <Button onClick={handleLetUsChoose} variant="outline">
                    No preference / Best available
                  </Button>
                </div>
              ) : cleaners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <UserX className="h-12 w-12 text-gray-400" />
                  <p className="text-gray-600 text-center">
                    {state.date && (state.address.suburb || state.address.city)
                      ? 'No cleaners available for this date and location.'
                      : 'Select a date and location to see available cleaners.'}
                  </p>
                  <Button onClick={handleLetUsChoose} variant="outline">
                    No preference / Best available
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                    {/* No preference option */}
                    <motion.button
                      onClick={handleLetUsChoose}
                      className={cn(
                        'flex-shrink-0 relative rounded-xl border-2 p-4 min-w-[140px] text-center transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-primary/30',
                        !selectedCleanerId && !selectedTeam
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-xs font-semibold text-gray-900">No preference</p>
                        <p className="text-[10px] text-gray-600">Best available</p>
                        {!selectedCleanerId && !selectedTeam && (
                          <CheckCircle className="h-4 w-4 text-primary absolute top-2 right-2" />
                        )}
                      </div>
                    </motion.button>

                    {/* Cleaner cards */}
                    {sortedCleaners.map((cleaner) => {
                      const isSelected = selectedCleanerId === cleaner.id;
                      const isFavorite = favoriteCleanerIds.has(cleaner.id);
                      const isToggling = togglingFavoriteId === cleaner.id;
                      return (
                        <motion.div
                          key={cleaner.id}
                          className="flex-shrink-0"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <button
                            onClick={() => handleSelectCleaner(cleaner.id)}
                            className={cn(
                              'relative rounded-xl border-2 p-4 min-w-[140px] text-center transition-all',
                              'focus:outline-none focus:ring-2 focus:ring-primary/30',
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-lg'
                                : isFavorite
                                ? 'border-teal-200 bg-teal-50/50 hover:border-primary/40 hover:shadow-md'
                                : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'
                            )}
                          >
                            <div className="flex flex-col items-center gap-2">
                              {/* Favorite button */}
                              <button
                                onClick={(e) => handleToggleFavorite(cleaner.id, e)}
                                disabled={isToggling}
                                className={cn(
                                  'absolute top-2 left-2 z-10 p-1 rounded-full transition-colors',
                                  'hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/30',
                                  isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500',
                                  isToggling && 'opacity-50 cursor-wait'
                                )}
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                {isToggling ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Heart className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
                                )}
                              </button>

                              {cleaner.photo_url ? (
                                <Image
                                  src={cleaner.photo_url}
                                  alt={cleaner.name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                  <User className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-gray-900">{cleaner.name.split(' ')[0]} {cleaner.name.split(' ')[1]?.[0]}.</p>
                                <p className="text-[10px] text-gray-600">{cleaner.rating} ⭐</p>
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-primary absolute top-2 right-2" />
                              )}
                              {isFavorite && !isSelected && (
                                <div className="absolute top-2 right-2">
                                  <Heart className="h-3 w-3 text-red-500 fill-current" />
                                </div>
                              )}
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {(state.service === 'Standard' || state.service === 'Airbnb') && (
          <section className="border-t pt-10">
            <FrequencySelector
              value={state.frequency}
              onChange={(frequency) => updateField('frequency', frequency)}
              discounts={discounts}
              pricingByFrequency={frequencyPricing}
            />
          </section>
        )}
      </div>

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
            Back
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
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

