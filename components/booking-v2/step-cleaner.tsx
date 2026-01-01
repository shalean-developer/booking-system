'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, UserX, AlertCircle, Sparkles, Check, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { CleanerCard } from '@/components/cleaner-card';
import { cn } from '@/lib/utils';
import type { Cleaner, AvailableCleanersResponse, TeamName } from '@/types/booking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { requiresTeam } from '@/lib/booking-utils';

export function StepCleaner() {
  const { state, updateField } = useBookingV2();
  const router = useRouter();
  const { getContactPath, getReviewPath } = useBookingPath();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null);
  const initialTeam = useMemo<TeamName | null>(() => {
    const teamValue = state.selected_team;
    const validTeams: TeamName[] = ['Team A', 'Team B', 'Team C'];
    return validTeams.includes(teamValue as TeamName) ? (teamValue as TeamName) : null;
  }, [state.selected_team]);
  const [selectedTeam, setSelectedTeam] = useState<TeamName | null>(initialTeam);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'recommended' | 'rating' | 'experience'>('recommended');
  const [showTopRatedOnly, setShowTopRatedOnly] = useState(false);

  const needsTeam = requiresTeam(state.service);

  useEffect(() => {
    const fetchCleaners = async () => {
      if (needsTeam) {
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
          date: state.date || '',
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
        setError('Failed to load available cleaners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCleaners();
  }, [state.date, state.address.city, needsTeam]);

  const handleSelectTeam = async (teamName: TeamName) => {
    if (!state.service || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      setSelectedTeam(teamName);
      updateField('selected_team', teamName);
      updateField('requires_team', true);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      router.push(getReviewPath(state.service));
    } catch (err) {
      setError('Failed to select team. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSelectCleaner = async (cleanerId: string) => {
    if (!state.service || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setSelectedCleanerId(cleanerId);
      updateField('cleaner_id', cleanerId);
      
      router.push(getReviewPath(state.service));
    } catch (err) {
      setError('Failed to select cleaner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (state.service) {
      router.push(getContactPath(state.service));
    }
  };

  const handleLetUsChoose = async () => {
    if (!state.service || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      updateField('cleaner_id', null);
      updateField('selectedCleaner', null);
      updateField('selected_team', null);
      
      router.push(getReviewPath(state.service));
    } catch (err) {
      setError('Failed to proceed');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
      >
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {needsTeam ? 'Select Your Team' : 'Select Your Cleaner'}
          </h2>
        </div>

        {needsTeam ? (
          <div className="grid gap-4 md:gap-6 md:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 h-48 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 h-64 rounded-2xl"></div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </motion.div>
    );
  }

  if (error && !needsTeam) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
      >
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Select Your Cleaner
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-gray-600 text-center">{error}</p>
          <Button onClick={handleLetUsChoose} variant="outline">
            Let us choose for you
          </Button>
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
      <div className="mb-8 space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {needsTeam ? 'Select Your Team' : 'Select Your Cleaner'}
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          {needsTeam 
            ? 'Choose a team for your deep cleaning service'
            : 'Choose your preferred cleaner or let us assign one for you'}
        </p>
      </div>

      {needsTeam ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:gap-6 md:grid-cols-3">
            {(['Team A', 'Team B', 'Team C'] as TeamName[]).map((teamName) => {
              const isSelected = selectedTeam === teamName;
              return (
                <motion.button
                  key={teamName}
                  onClick={() => handleSelectTeam(teamName)}
                  disabled={isSubmitting}
                  className={cn(
                    'relative rounded-2xl border-2 p-6 text-left transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md',
                    isSubmitting && 'opacity-50 cursor-not-allowed'
                  )}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{teamName}</h3>
                    {isSelected && (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Professional team for deep cleaning services
                  </p>
                </motion.button>
              );
            })}
          </div>

          <motion.button
            onClick={handleLetUsChoose}
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-all',
              'hover:border-primary/40 hover:bg-primary/5',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              isSubmitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Sparkles className="h-5 w-5 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Let us choose for you</p>
          </motion.button>
        </div>
      ) : (
        <div className="space-y-6">
          {cleaners.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Select value={sortOption} onValueChange={(value: any) => setSortOption(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {cleaners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <UserX className="h-12 w-12 text-gray-400" />
              <p className="text-gray-600 text-center">
                No cleaners available for this date and location.
              </p>
              <Button onClick={handleLetUsChoose} variant="outline">
                Let us choose for you
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedCleaners.map((cleaner) => {
                const isSelected = selectedCleanerId === cleaner.id;
                return (
                  <CleanerCard
                    key={cleaner.id}
                    cleaner={cleaner}
                    isSelected={isSelected}
                    isLoading={isSubmitting}
                    onSelect={handleSelectCleaner}
                  />
                );
              })}
            </div>
          )}

          <motion.button
            onClick={handleLetUsChoose}
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-all',
              'hover:border-primary/40 hover:bg-primary/5',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              isSubmitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Sparkles className="h-5 w-5 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Let us choose for you</p>
          </motion.button>
        </div>
      )}

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
            Back to contact
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

