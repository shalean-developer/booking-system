'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, UserX, AlertCircle, CalendarDays, Clock, MapPin, Sparkles, ShieldCheck, SlidersHorizontal, Check, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/lib/useBooking';
import { CleanerCard } from '@/components/cleaner-card';
import { cn } from '@/lib/utils';
import type { Cleaner, AvailableCleanersResponse, ServiceType, TeamName } from '@/types/booking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export function StepSelectCleaner() {
  const { state, updateField } = useBooking();
  const router = useRouter();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamName | null>(state.selected_team ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'recommended' | 'rating' | 'experience'>('recommended');
  const [showTopRatedOnly, setShowTopRatedOnly] = useState(false);

  // Check if service requires team assignment
  const requiresTeam = state.service === 'Deep' || state.service === 'Move In/Out';

  // Fetch available cleaners (only for non-team services)
  useEffect(() => {
    const fetchCleaners = async () => {
      if (requiresTeam) {
        // For team services, teams are always available - no need to fetch
        // Availability is checked when admin assigns the team
        setIsLoading(false);
        return;
      }

      if (!state.date || !state.address.city) {
        setError('Date and address information is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          date: state.date,
          city: state.address.city,
        });

        const response = await fetch(`/api/cleaners/available?${params}`);
        const data: AvailableCleanersResponse = await response.json();

        if (data.ok) {
          setCleaners(data.cleaners);
        } else {
          setError(data.error || 'Failed to fetch cleaners');
        }
      } catch (err) {
        console.error('Error fetching cleaners:', err);
        setError('Failed to load available cleaners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCleaners();
  }, [state.date, state.address.city, requiresTeam]);

  const handleSelectTeam = (teamName: TeamName) => {
    setSelectedTeam(teamName);
    updateField('selected_team', teamName);
    updateField('requires_team', true);
  };

  const handleSelectCleaner = (cleanerId: string) => {
    setSelectedCleanerId(cleanerId);
    updateField('cleaner_id', cleanerId);
  };

  const handleBack = () => {
    const slug = serviceTypeToSlug(state.service!);
    router.push(`/booking/service/${slug}/contact`);
  };

  const handleContinue = async () => {
    if (!selectedCleanerId || !state.service) return;
    try {
      setIsSubmitting(true);
      updateField('step', 6);
      const slug = serviceTypeToSlug(state.service);
      router.push(`/booking/service/${slug}/review`);
    } catch (err) {
      console.error('Error continuing to review:', err);
      setError('Failed to proceed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduledDateLabel = useMemo(() => {
    if (!state.date) return null;
    try {
      return new Date(state.date).toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return state.date;
    }
  }, [state.date]);

  const sortedCleaners = useMemo(() => {
    let list = [...cleaners];

    if (showTopRatedOnly) {
      list = list.filter((cleaner) => (cleaner.rating ?? 0) >= 4.5);
    }

    switch (sortOption) {
      case 'rating':
        list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'experience':
        list.sort((a, b) => (b.years_experience ?? 0) - (a.years_experience ?? 0));
        break;
      default:
        list.sort((a, b) => {
          const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.years_experience ?? 0) - (a.years_experience ?? 0);
        });
        break;
    }

    return list;
  }, [cleaners, showTopRatedOnly, sortOption]);

  const recommendedCleanerId = useMemo(() => {
    if (!cleaners.length) return null;
    return cleaners.reduce((top, current) => {
      if (!top) return current;
      if ((current.rating ?? 0) > (top.rating ?? 0)) return current;
      if ((current.rating ?? 0) === (top.rating ?? 0) && (current.years_experience ?? 0) > (top.years_experience ?? 0)) {
        return current;
      }
      return top;
    }).id;
  }, [cleaners]);

  const displayedCleaners = useMemo(() => sortedCleaners, [sortedCleaners]);

  if (isLoading) {
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
            {requiresTeam ? 'Select Your Team' : 'Select Your Cleaner'}
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            {requiresTeam 
              ? `Choose your preferred team for ${state.service} service`
              : `Finding available cleaners in ${state.address.city} for ${state.date}`
            }
          </p>
        </div>

        {requiresTeam ? (
          /* Team Selection Loading */
          <div className="grid gap-4 md:gap-6 md:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 h-48 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Cleaner Selection Loading */
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 h-64 rounded-2xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Loading Message */}
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-slate-600">
            {requiresTeam ? 'Loading team options...' : 'Loading available cleaners...'}
          </span>
        </div>
      </motion.div>
    );
  }

  // Don't show error state for team bookings - teams are always available
  if (error && !requiresTeam) {
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
            Select Your Cleaner
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Available cleaners in {state.address.city} for {state.date}
          </p>
        </div>

        {/* Error State */}
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Cleaners</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className={cn(
                "rounded-full px-6 font-semibold",
                "bg-primary hover:bg-primary/90 text-white",
                "focus:ring-2 focus:ring-primary/30 focus:outline-none"
              )}
            >
              Try Again
            </Button>
            <Button 
              onClick={handleBack}
              variant="outline"
              className={cn(
                "rounded-full px-6 font-semibold",
                "focus:ring-2 focus:ring-primary/30 focus:outline-none"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contact
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleManualAssignment = async () => {
    try {
      setIsSubmitting(true);
      
      // Set special 'manual' identifier for cleaner_id
      updateField('cleaner_id', 'manual');
      updateField('step', 6);

      // Navigate to review step
      const slug = serviceTypeToSlug(state.service!);
      router.push(`/booking/service/${slug}/review`);
    } catch (err) {
      console.error('Error proceeding with manual assignment:', err);
      setError('Failed to proceed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show "no cleaners" state for team bookings - teams are always available
  if (cleaners.length === 0 && !requiresTeam) {
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
            Let Us Choose for You
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Available cleaners in {state.address.city} for {state.date}
          </p>
        </div>

        {/* No Cleaners State */}
        <div className="text-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UserX className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No Available Cleaners in Our System
            </h3>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              We don't have cleaners available in our system for your selected date and area. 
              Don't worry! Our team will manually assign the best cleaner for you and confirm your booking.
            </p>

            <div className="space-y-3">
              <Button 
                onClick={handleManualAssignment}
                disabled={isSubmitting}
                size="lg"
                className={cn(
                  "w-full rounded-full px-8 py-3 font-semibold shadow-lg",
                  "bg-primary hover:bg-primary/90 text-white",
                  "focus:ring-2 focus:ring-primary/30 focus:outline-none",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Choose for Me'
                )}
              </Button>
              
              <Button 
                onClick={handleBack} 
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-full px-6 font-semibold",
                  "focus:ring-2 focus:ring-primary/30 focus:outline-none",
                  "transition-all duration-200"
                )}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contact
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Our team will contact you within 24 hours to confirm your cleaner assignment
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Team Selection UI
  if (requiresTeam) {
    const teams: { name: TeamName; description: string; color: string; badge?: string; highlights: string[] }[] = [
      {
        name: 'Team A',
        description: 'Experienced team with proven track record',
        color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
        badge: 'Most Booked',
        highlights: ['4.9 ★ average rating', '3 cleaners + supervisor', 'Great for move in/out deep resets'],
      },
      {
        name: 'Team B',
        description: 'Professional team specializing in deep cleaning',
        color: 'bg-green-50 border-green-200 hover:bg-green-100',
        highlights: ['Eco-friendly product options', 'Stain and grout experts', 'Ideal for large homes'],
      },
      {
        name: 'Team C',
        description: 'Reliable team with excellent customer reviews',
        color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
        highlights: ['Pet-friendly', 'Flexible scheduling', 'Detailed finishing touches'],
      },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
      >
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Select your team
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Choose the crew that best matches your home. Our admin will assign specific cleaners to the team you select.
          </p>
        </div>

        {/* Teams Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 md:gap-6 md:grid-cols-3 mb-8"
        >
          {teams.map((team, index) => (
            <motion.div
              key={team.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => handleSelectTeam(team.name)}
                disabled={isSubmitting}
                className={cn(
                  'relative w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left focus:ring-2 focus:ring-primary/30 focus:outline-none',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedTeam === team.name ? 'border-primary bg-primary/10 shadow-lg' : team.color
                )}
              >
                {team.badge && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {team.badge}
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                  {selectedTeam === team.name && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                <ul className="mb-4 space-y-2 text-xs text-gray-600">
                  {team.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-gray-500">
                  We’ll assign the exact team members and share their profiles before the clean.
                </div>
              </button>
            </motion.div>
          ))}
        </motion.div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Not sure which team to pick? <Link href="/contact" className="font-semibold text-primary underline hover:text-primary/80">Chat with our bookings team</Link> and we’ll guide you.
        </div>

        {/* Navigation */}
        <div className="mt-8 space-y-3 border-t pt-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
              className={cn(
                'rounded-full px-4 font-semibold text-slate-600 hover:text-primary',
                'focus:ring-2 focus:ring-primary/30 focus:outline-none',
                'transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start'
              )}
            >
              Back to contact
            </Button>
            <Button
              onClick={async () => {
                if (!selectedTeam || !state.service) return;
                try {
                  setIsSubmitting(true);
                  updateField('step', 6);
                  const slug = serviceTypeToSlug(state.service);
                  router.push(`/booking/service/${slug}/review`);
                } catch (err) {
                  console.error('Error selecting team:', err);
                  setError('Failed to select team');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={!selectedTeam || isSubmitting}
              className={cn(
                'rounded-full px-8 py-3 font-semibold shadow-lg w-full sm:w-auto justify-center',
                'bg-primary hover:bg-primary/90 text-white',
                'focus:ring-2 focus:ring-primary/30 focus:outline-none',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </span>
              ) : (
                'Continue to review'
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            We’ll double-check availability and send a confirmation email once your team is locked in.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
    >
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <CalendarDays className="h-3.5 w-3.5" />
          Step 3 of 3 · Finalise
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Select your cleaner
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl">
            Pick the professional who best fits your home. Every cleaner is vetted, insured and brings eco-friendly supplies on request.
          </p>
        </div>

        {(scheduledDateLabel || state.time || state.address.city) && (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              {scheduledDateLabel && (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {scheduledDateLabel}
                </span>
              )}
              {state.time && (
                <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4 text-primary" />
                  {state.time}
                </span>
              )}
              {state.address.city && (
                <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-primary" />
                  {state.address.city}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-primary/80">
              <ShieldCheck className="h-4 w-4" />
              Background checked · Trusted by recurring customers
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>
            Showing {displayedCleaners.length} of {cleaners.length} available cleaner{cleaners.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <label htmlFor="sort-option" className="text-sm font-medium text-slate-700">
              Sort by
            </label>
            <Select
              value={sortOption}
              onValueChange={(value) => setSortOption(value as typeof sortOption)}
            >
              <SelectTrigger id="sort-option" className="w-[200px] rounded-full border-slate-200 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="rating">Highest rating</SelectItem>
                <SelectItem value="experience">Most experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => setShowTopRatedOnly((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
              showTopRatedOnly
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary'
            )}
          >
            <Sparkles className="h-4 w-4" />
            {showTopRatedOnly ? 'Top rated only' : 'Show only 4.5★+'}
          </button>
        </div>
      </div>

      {/* Cleaners Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
      >
        {displayedCleaners.map((cleaner, index) => {
          const highlight = cleaner.specialties?.[0] || `Great with homes in ${cleaner.areas?.[0] ?? state.address.city}`;
          const badgeLabel = recommendedCleanerId === cleaner.id ? 'Most booked' : undefined;

          return (
            <motion.div
              key={cleaner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CleanerCard
                cleaner={cleaner}
                onSelect={handleSelectCleaner}
                isSelected={selectedCleanerId === cleaner.id}
                isLoading={isSubmitting && selectedCleanerId === cleaner.id}
                badgeLabel={badgeLabel}
                highlight={highlight}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Manual assignment CTA */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Prefer we hand-pick someone for you? Our bookings team can match you with the best fit based on your requirements.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualAssignment}
            disabled={isSubmitting}
            className="rounded-full border-primary/40 text-primary hover:bg-primary/10"
          >
            Let Shalean choose
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-3 border-t pt-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isSubmitting}
            className={cn(
              'rounded-full px-4 font-semibold text-slate-600 hover:text-primary',
              'focus:ring-2 focus:ring-primary/30 focus:outline-none',
              'transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start'
            )}
          >
            Back to contact
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedCleanerId || isSubmitting}
            className={cn(
              'rounded-full px-8 py-3 font-semibold shadow-lg w-full sm:w-auto justify-center',
              'bg-primary hover:bg-primary/90 text-white',
              'focus:ring-2 focus:ring-primary/30 focus:outline-none',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </span>
            ) : (
              'Continue to review'
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          You can switch cleaners later – we’ll confirm availability with your chosen professional and share their profile before the visit.
        </p>
      </div>
    </motion.div>
  );
}
