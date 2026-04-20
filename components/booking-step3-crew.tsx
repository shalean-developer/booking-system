'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  Sparkles,
  Star,
  AlertTriangle,
  Users,
  CalendarDays,
  Clock,
  MapPin,
  Loader2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import type { OptimalTeamResult } from '@/lib/team-optimizer';
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '@/lib/team-optimizer';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { BookingSummary } from '@/components/booking/booking-summary';
import { StickyCTA } from '@/components/booking/mobile/sticky-cta';

export interface BookingStep3CrewProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  onBack: () => void;
  onContinue: () => void;
  pricing: {
    total: number;
    dbPricingRows: { id: string; label: string; value: number }[];
    engineMeta: {
      estimatedHours: number;
      hoursPerCleaner: number;
      marginRateBoostApplied: number;
      teamSize: number;
      estimatedJobHours: number;
    } | null;
  };
  serviceTitle: string;
  apiCleaners: ApiCleaner[];
  cleanersLoading: boolean;
  formatDate: (dateStr: string) => string;
  optimalTeam: OptimalTeamResult;
}

const AUTO_ASSIGN_ID = 'auto-assign';

const AVATAR_ROTATION = ['bg-pink-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-orange-500'] as const;

function formatZarSimple(price: number) {
  return `R ${price.toLocaleString('en-ZA')}`;
}

const isTeamService = (id: ServiceType) => id === 'deep' || id === 'move';

function formatTimeDisplay(t: string) {
  if (!t) return '—';
  const parts = t.split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-ZA', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function cleanerInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
  return initials ? initials.toUpperCase() : '?';
}

type MappedCleaner = {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  photo: string | null | undefined;
  rating: number;
  reviewCount: number;
  jobCount: number;
  slotTimeLabel: string;
  speciality: string | null;
  completionRate: number | null | undefined;
};

/** Single strong tag only — omit when nothing compelling */
function cleanerTag(c: MappedCleaner): string | null {
  const spec = (c.speciality || '').toLowerCase();
  if (spec.includes('eco') || spec.includes('green') || spec.includes('organic')) return 'Eco';
  if (c.rating >= 4.6 && c.reviewCount >= 2) return 'Top rated';
  if ((c.completionRate ?? 0) >= 92 || c.jobCount >= 15) return 'Fast';
  if (c.rating >= 4.5 && c.reviewCount >= 1) return 'Top rated';
  return null;
}

/** Compact row for swipe cards — fast scan */
const StarRowCompact = ({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) => (
  <div className={cn('flex items-center justify-center gap-0.5', className)}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={cn(
          'h-2.5 w-2.5',
          s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200',
        )}
      />
    ))}
    <span className="text-xs font-semibold text-gray-800 tabular-nums">{rating.toFixed(1)}</span>
  </div>
);

export function BookingStep3Crew({
  data,
  setData,
  onBack,
  onContinue,
  pricing,
  serviceTitle,
  apiCleaners,
  cleanersLoading,
  formatDate,
  optimalTeam,
}: BookingStep3CrewProps) {
  const pricingTotalZar = pricing.total;
  const [attempted, setAttempted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const useTeams = isTeamService(data.service);
  const showCleanerList = data.service === 'standard' || data.service === 'airbnb';

  const [manualMode, setManualMode] = useState(() => Boolean(data.cleanerId));
  const [teamOptionsOpen, setTeamOptionsOpen] = useState(
    () =>
      Boolean(data.teamSizeUserOverride) &&
      Math.round(data.numberOfCleaners ?? 1) !== optimalTeam.teamSize,
  );

  const selectedTeamSize = Math.min(
    MAX_TEAM_SIZE,
    Math.max(MIN_TEAM_SIZE, Math.round(data.numberOfCleaners ?? optimalTeam.teamSize)),
  );
  const hoursEachSelected =
    selectedTeamSize > 0 ? optimalTeam.totalWorkHours / selectedTeamSize : optimalTeam.totalWorkHours;
  const showLargerTeamWarning = selectedTeamSize > optimalTeam.teamSize;

  const setTeamSize = (n: number) => {
    const clamped = Math.min(MAX_TEAM_SIZE, Math.max(MIN_TEAM_SIZE, Math.round(n)));
    setData((p) => ({
      ...p,
      numberOfCleaners: clamped,
      teamSizeUserOverride: clamped !== optimalTeam.teamSize,
    }));
  };

  const useRecommendedTeamSize = () => {
    setData((p) => ({
      ...p,
      numberOfCleaners: optimalTeam.teamSize,
      teamSizeUserOverride: false,
    }));
    setTeamOptionsOpen(false);
  };

  const selectedId = useMemo(() => {
    if (data.cleanerId) return data.cleanerId;
    if (data.teamId) return data.teamId;
    return AUTO_ASSIGN_ID;
  }, [data.cleanerId, data.teamId]);

  const dateLabel = data.date ? formatDate(data.date) : 'Pick a date';
  const timeLabel = formatTimeDisplay(data.time);
  const locationLabel = data.workingArea?.trim() || 'Location';

  const mappedCleaners = useMemo(
    () =>
      apiCleaners.map((c, i) => ({
        id: c.id,
        name: c.name,
        initials: cleanerInitials(c.name),
        avatarBg: AVATAR_ROTATION[i % AVATAR_ROTATION.length]!,
        photo: c.photo_url,
        rating: c.rating ?? 0,
        reviewCount: c.reviews_count ?? 0,
        jobCount: c.completed_jobs_count ?? 0,
        slotTimeLabel: timeLabel,
        speciality: c.specialties?.[0]?.trim() || c.bio?.trim()?.slice(0, 80) || null,
        completionRate: c.completion_rate,
      })),
    [apiCleaners, timeLabel],
  );

  const needsCleanerFromApi = showCleanerList;
  const hasApiCleaners = mappedCleaners.length > 0;
  const isValid =
    !needsCleanerFromApi ||
    selectedId === AUTO_ASSIGN_ID ||
    (selectedId !== AUTO_ASSIGN_ID && mappedCleaners.some((c) => c.id === selectedId));

  const selectedName =
    selectedId === AUTO_ASSIGN_ID
      ? useTeams
        ? 'Coordinated crew (assigned)'
        : 'Best available cleaner'
      : mappedCleaners.find((c) => c.id === selectedId)?.name ?? '';

  const selectedCleanerData = useMemo(
    () => (selectedId !== AUTO_ASSIGN_ID ? mappedCleaners.find((c) => c.id === selectedId) ?? null : null),
    [selectedId, mappedCleaners]
  );

  const handleSelectAuto = () => {
    setManualMode(false);
    setData((p) => ({ ...p, cleanerId: '', teamId: '' }));
  };

  const handleSelectCleaner = (id: string) => {
    setData((p) => ({ ...p, cleanerId: id, teamId: '' }));
  };

  const handleChooseManual = () => {
    setManualMode(true);
  };

  const handleContinue = () => {
    setAttempted(true);
    if (!isValid) {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      return;
    }
    onContinue();
  };

  const isAutoPrimary = selectedId === AUTO_ASSIGN_ID && !manualMode;

  const mobileStickyPriceSummary = useMemo(() => {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-xl border border-gray-100 bg-gray-50/90 p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Your booking</p>
          <div className="flex justify-between items-start gap-3">
            <span className="text-gray-600">Service</span>
            <span className="font-semibold text-gray-900 text-right">{serviceTitle}</span>
          </div>
          <div className="flex justify-between items-start gap-3">
            <span className="text-gray-600">Cleaner</span>
            <span className="font-semibold text-gray-900 text-right">{selectedName}</span>
          </div>
          <div className="flex justify-between items-start gap-3 text-xs">
            <span className="text-gray-500">When</span>
            <span className="font-medium text-gray-700 text-right">
              {dateLabel} · {timeLabel}
            </span>
          </div>
        </div>
        {pricing.dbPricingRows.filter((r) => r.value !== 0).length > 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50/90 p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Breakdown</p>
            {pricing.dbPricingRows
              .filter((r) => r.value !== 0)
              .map((row) => (
                <div key={row.id} className="flex justify-between items-start gap-3">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0">
                    {formatZarSimple(row.value)}
                  </span>
                </div>
              ))}
          </div>
        ) : null}
        <div className="flex justify-between items-center gap-3 text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
          <span>Total</span>
          <span className="tabular-nums">{formatZarSimple(pricingTotalZar)}</span>
        </div>
      </div>
    );
  }, [serviceTitle, selectedName, dateLabel, timeLabel, pricing.dbPricingRows, pricingTotalZar]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-nowrap sm:flex-wrap items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div className="min-w-0 hidden sm:block">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Shalean Cleaning Services</p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Your cleaner</h1>
            <p className="text-xs text-gray-500 mt-0.5">Step 3 of 4 · Takes ~1 min</p>
          </div>
        </div>
        <div className="shrink-0">
          <BookingFlowStepIndicator activeStep={3} stepHint="Takes ~1 min" />
        </div>
      </div>

      <BookingFlowLayout
        sidebar={
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Selected cleaner
              </p>
              <div className="mt-3 flex items-center gap-3">
                {selectedCleanerData?.photo ? (
                  <img
                    src={selectedCleanerData.photo}
                    alt={selectedCleanerData.name}
                    className="h-12 w-12 rounded-full object-cover border border-white shadow-sm"
                  />
                ) : (
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-sm',
                      selectedCleanerData?.avatarBg ?? 'bg-violet-500'
                    )}
                  >
                    {selectedCleanerData?.initials ?? 'AI'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-violet-700">
                    {selectedCleanerData?.name ?? selectedName}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-semibold tabular-nums">
                      {selectedCleanerData?.rating && selectedCleanerData.rating > 0
                        ? selectedCleanerData.rating.toFixed(1)
                        : 'New'}
                    </span>
                    {selectedCleanerData?.reviewCount ? (
                      <span className="text-muted-foreground">({selectedCleanerData.reviewCount})</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Cleaner will be confirmed after booking</p>
            </div>

            <BookingSummary
              mode="preview"
              step={3}
              serviceTitle={serviceTitle}
              propertySummary={`${data.bedrooms} bed · ${data.bathrooms} bath · ${locationLabel}`}
              bookingDetails={{
                where:
                  [data.address?.trim(), data.workingArea?.trim()].filter(Boolean).join(' · ') ||
                  locationLabel,
                what: serviceTitle,
                when: `${dateLabel} · ${timeLabel}`,
              }}
              onEditBookingDetail={() => {
                onBack();
              }}
              onFindCleaner={handleContinue}
              findCleanerCtaDisabled={!isValid}
              primaryCtaLabel="Continue to final step →"
              primaryCtaSubtext="Next: Confirm your booking"
              extrasSummary={data.extras.length > 0 ? `${data.extras.length} add-on(s)` : 'None'}
              totalZar={pricingTotalZar}
              pricingContext={
                pricing.engineMeta
                  ? {
                      estimatedJobHours:
                        pricing.engineMeta.estimatedHours ?? pricing.engineMeta.estimatedJobHours,
                      teamSize: pricing.engineMeta.teamSize,
                    }
                  : null
              }
              footer={
                attempted && !isValid ? (
                  <p className="text-xs text-red-500 text-center">Please select a cleaner to continue</p>
                ) : undefined
              }
            />
          </div>
        }
      >
        <p className="text-xs font-bold tracking-widest text-violet-600 uppercase">Step 3 of 4</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 space-y-4">
          <div
            className={cn(
              'flex gap-2',
              // Mobile: single horizontal row, swipe if needed (no 2×2 wrap)
              'max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:overscroll-x-contain max-sm:touch-pan-x',
              'max-sm:[-ms-overflow-style:none] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden',
              'sm:flex-wrap'
            )}
          >
            <div className="flex shrink-0 items-center gap-1.5 bg-gray-50/80 border border-gray-200 rounded-full px-3 py-1.5 max-w-[11rem]">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-semibold text-gray-600 truncate">{dateLabel}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 bg-gray-50/80 border border-gray-200 rounded-full px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{timeLabel}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 bg-gray-50/80 border border-gray-200 rounded-full px-3 py-1.5 max-w-[10rem] sm:max-w-none">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-semibold text-gray-600 truncate">{locationLabel}</span>
            </div>
            <span className="inline-flex shrink-0 items-center whitespace-nowrap text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1.5 rounded-full border border-violet-200">
              {formatZarSimple(pricingTotalZar)}
            </span>
          </div>
        </div>

        <section className="space-y-4">
          {/* 1 — Recommended (default) */}
          <motion.div
            role="button"
            tabIndex={0}
            layout
            onClick={handleSelectAuto}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectAuto();
              }
            }}
            whileHover={{ scale: isAutoPrimary ? 1.02 : 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              'w-full text-left rounded-2xl border-2 p-4 sm:p-6 transition-shadow duration-200 cursor-pointer select-none',
              isAutoPrimary
                ? 'border-violet-500 bg-gradient-to-br from-violet-100/90 via-white to-violet-50/50 shadow-lg shadow-violet-200/60 ring-2 ring-violet-200/50 max-sm:ring-1 max-sm:shadow-md'
                : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-md',
            )}
            aria-pressed={isAutoPrimary}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className={cn(
                  'flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors shadow-inner',
                  isAutoPrimary ? 'bg-violet-600 sm:scale-105' : 'bg-violet-100',
                )}
              >
                <Sparkles
                  className={cn(
                    'w-5 h-5 sm:w-7 sm:h-7',
                    isAutoPrimary ? 'text-white' : 'text-violet-600',
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide sm:tracking-wider text-violet-600">
                      <span className="sm:hidden">Recommended</span>
                      <span className="hidden sm:inline">Recommended for you</span>
                    </p>
                    <p className="hidden sm:block text-sm text-gray-600 mt-1">
                      Best match for your time &amp; location
                    </p>
                    <h2 className="text-base sm:text-xl font-bold text-gray-900 mt-1 sm:mt-2 leading-snug pr-1">
                      <span className="sm:hidden">
                        {useTeams ? 'Best crew for your job' : 'Best available cleaner'}
                      </span>
                      <span className="hidden sm:inline">
                        {useTeams
                          ? "We'll assign the best crew for your job"
                          : 'Best available cleaner for your booking'}
                      </span>
                    </h2>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="shrink-0 rounded-full p-1.5 text-violet-600 hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                        aria-label="What’s included with this option"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Info className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[min(calc(100vw-2rem),20rem)] p-3 sm:p-4 text-sm"
                      align="end"
                      side="bottom"
                      sideOffset={6}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-xs font-semibold text-foreground mb-2">What you get</p>
                      <ul className="space-y-2 text-xs text-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden />
                          Top-rated
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden />
                          Fully insured
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden />
                          Available for your slot
                        </li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">
                        Arrives on time · Finishes within your booked time
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div
                  className={cn(
                    'mt-3 sm:mt-4 inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold pointer-events-none',
                    isAutoPrimary ? 'bg-violet-600 text-white shadow-md' : 'bg-violet-100 text-violet-800',
                  )}
                >
                  <span className="sm:hidden">Confirm</span>
                  <span className="hidden sm:inline">Confirm this cleaner</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <AnimatePresence>
                {isAutoPrimary && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex-shrink-0 text-violet-600"
                  >
                    <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <section className="flex flex-col gap-3" aria-label="Trust and scheduling">
            <div className="flex flex-row gap-2 sm:gap-3 items-stretch min-w-0">
              {/* Trust */}
              <div className="rounded-xl border border-gray-100 bg-white/90 px-2.5 py-2.5 sm:px-4 sm:py-3 space-y-1 sm:space-y-1.5 text-[11px] sm:text-sm text-gray-800 flex-1 min-w-0">
                <p className="flex items-center gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                  <span className="leading-tight">Vetted professionals</span>
                </p>
                <p className="flex items-center gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                  <span className="leading-tight">Reliable &amp; on time</span>
                </p>
                <p className="flex items-center gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                  <span className="leading-tight sm:hidden">Backup if needed</span>
                  <span className="leading-tight hidden sm:inline">Backup available if needed</span>
                </p>
              </div>

              {/* Team size — summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 sm:p-4 flex-1 min-w-0">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 id="team-size-heading" className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                      {useTeams ? 'Crew size' : 'Duration & team'}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 sm:mt-1 tabular-nums">
                      {selectedTeamSize} {selectedTeamSize === 1 ? 'cleaner' : 'cleaners'} · ~{hoursEachSelected.toFixed(1)}h
                    </p>
                    {!teamOptionsOpen && (
                      <button
                        type="button"
                        onClick={() => setTeamOptionsOpen(true)}
                        className="text-[11px] sm:text-xs font-semibold text-violet-600 hover:text-violet-800 mt-1 sm:mt-2 underline underline-offset-2"
                      >
                        Need it faster?
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {teamOptionsOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs text-gray-500">
                    More cleaners shorten on-site time. Recommended: {optimalTeam.teamSize}.
                  </p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Number of cleaners">
                    {Array.from(
                      { length: MAX_TEAM_SIZE - MIN_TEAM_SIZE + 1 },
                      (_, i) => MIN_TEAM_SIZE + i,
                    ).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setTeamSize(n)}
                        className={cn(
                          'min-w-[2.5rem] px-3 py-2 rounded-xl text-sm font-bold border-2 transition-colors',
                          selectedTeamSize === n
                            ? 'border-violet-600 bg-violet-50 text-violet-800'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300',
                        )}
                        aria-pressed={selectedTeamSize === n}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {data.teamSizeUserOverride && selectedTeamSize !== optimalTeam.teamSize && (
                    <button
                      type="button"
                      onClick={useRecommendedTeamSize}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-800 underline underline-offset-2"
                    >
                      Use recommended ({optimalTeam.teamSize} cleaners)
                    </button>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {showLargerTeamWarning && (
              <div
                className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                role="status"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <span>Extra cleaners can change total price; we&apos;ll still match your preference.</span>
              </div>
            )}
          </section>

          {useTeams && (
            <p className="text-xs text-gray-500 px-1 -mt-2">
              Deep &amp; move jobs use a coordinated crew — we&apos;ll assign the best team for your date.
            </p>
          )}

          {/* 3 — Manual: horizontal scroll */}
          {showCleanerList && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => (manualMode ? handleSelectAuto() : handleChooseManual())}
                className="text-sm font-semibold text-violet-600 hover:text-violet-800 underline underline-offset-2 w-full text-center"
              >
                {manualMode ? '← Back to recommended match' : 'Prefer to choose yourself?'}
              </button>

              <AnimatePresence>
                {manualMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {needsCleanerFromApi && cleanersLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-gray-200 bg-white">
                        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4" />
                        <p className="text-slate-500 text-sm">Loading available cleaners…</p>
                      </div>
                    ) : needsCleanerFromApi && !hasApiCleaners ? (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-800">No cleaners for this time</p>
                        <p className="text-xs text-gray-500 mt-1">Try another slot — or use recommended.</p>
                        <button
                          type="button"
                          onClick={handleSelectAuto}
                          className="mt-4 text-sm font-bold text-violet-600"
                        >
                          Use recommended
                        </button>
                      </div>
                    ) : (
                      <div className="-mx-4 sm:mx-0">
                        <p className="text-[11px] font-medium text-gray-500 px-4 sm:px-0 mb-2">
                          <span className="sm:hidden">Choose a cleaner below — or keep recommended above</span>
                          <span className="hidden sm:inline">
                            Pick a cleaner — or stay with recommended above
                          </span>
                        </p>
                        <div
                          className={cn(
                            'flex gap-3',
                            // Mobile: vertical list — natural thumb scroll, full-width rows
                            'max-sm:flex-col max-sm:overflow-x-visible max-sm:touch-auto max-sm:pb-0 max-sm:pl-4 max-sm:pr-4',
                            // Tablet+: horizontal carousel
                            'sm:flex-row sm:overflow-x-auto sm:scroll-smooth sm:touch-pan-x sm:pb-2 sm:pt-0.5 sm:pl-0 sm:pr-8',
                            'sm:snap-x sm:snap-mandatory sm:[scrollbar-width:thin]',
                          )}
                          style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                          {mappedCleaners.map((cleaner) => {
                            const isSelected = selectedId === cleaner.id;
                            const tag = cleanerTag(cleaner);
                            return (
                              <motion.button
                                key={cleaner.id}
                                type="button"
                                onClick={() => handleSelectCleaner(cleaner.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className={cn(
                                  'relative rounded-xl border-2 bg-white text-left shadow-sm transition-colors duration-200',
                                  // Mobile: block wrapper; inner row handles layout
                                  'max-sm:block max-sm:w-full max-sm:px-3.5 max-sm:py-3.5 max-sm:min-h-[4.5rem] max-sm:snap-none',
                                  // Desktop: narrow carousel card
                                  'sm:flex sm:w-[min(210px,calc(100vw-5.5rem))] sm:flex-shrink-0 sm:snap-center sm:flex-col sm:items-stretch sm:px-3 sm:py-3 sm:min-h-0',
                                  isSelected
                                    ? 'border-violet-600 bg-violet-50/90 shadow-md ring-1 ring-violet-300/80 sm:scale-[1.02] sm:z-[1]'
                                    : 'border-gray-200/90 hover:border-violet-300',
                                )}
                                aria-pressed={isSelected}
                              >
                                {isSelected ? (
                                  <span className="absolute top-2 right-2 hidden sm:flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm">
                                    <Check className="h-3 w-3 stroke-[3]" aria-hidden />
                                  </span>
                                ) : null}
                                {/* Mobile: horizontal row */}
                                <div className="flex min-w-0 flex-1 flex-row items-center gap-3 sm:hidden">
                                  {cleaner.photo ? (
                                    <img
                                      src={cleaner.photo}
                                      alt=""
                                      className={cn(
                                        'h-12 w-12 shrink-0 rounded-full object-cover border border-white shadow-sm',
                                        isSelected ? 'ring-2 ring-violet-500' : '',
                                      )}
                                    />
                                  ) : (
                                    <div
                                      className={cn(
                                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-sm border border-white/80',
                                        cleaner.avatarBg,
                                        isSelected ? 'ring-2 ring-violet-500' : '',
                                      )}
                                    >
                                      {cleaner.initials}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1 space-y-0.5">
                                    <p
                                      className="truncate text-sm font-semibold leading-tight text-gray-900"
                                      title={cleaner.name}
                                    >
                                      {cleaner.name}
                                    </p>
                                    {cleaner.rating > 0 ? (
                                      <StarRowCompact
                                        rating={cleaner.rating}
                                        className="justify-start"
                                      />
                                    ) : (
                                      <span className="text-[11px] font-medium text-gray-400">New</span>
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      {tag ? (
                                        <span className="inline-flex max-w-full truncate rounded-full bg-violet-100/90 px-2 py-0.5 text-[10px] font-semibold leading-none text-violet-700">
                                          {tag}
                                        </span>
                                      ) : null}
                                      <span className="text-[10px] text-gray-500">Available for your slot</span>
                                    </div>
                                  </div>
                                  <span
                                    className={cn(
                                      'inline-flex shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-xs font-bold transition-colors',
                                      isSelected
                                        ? 'bg-violet-600 text-white shadow-sm'
                                        : 'border-2 border-violet-200 bg-white text-violet-800',
                                    )}
                                  >
                                    {isSelected ? (
                                      <>
                                        <Check className="mr-1 h-3.5 w-3.5 stroke-[3]" aria-hidden />
                                        Selected
                                      </>
                                    ) : (
                                      'Select'
                                    )}
                                  </span>
                                </div>
                                {/* Desktop: original vertical card */}
                                <div className="hidden flex-col items-center gap-1 text-center sm:flex">
                                  {cleaner.photo ? (
                                    <img
                                      src={cleaner.photo}
                                      alt=""
                                      className={cn(
                                        'h-9 w-9 rounded-full object-cover border border-white shadow-sm',
                                        isSelected ? 'ring-1 ring-violet-500' : '',
                                      )}
                                    />
                                  ) : (
                                    <div
                                      className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-sm border border-white/80',
                                        cleaner.avatarBg,
                                        isSelected ? 'ring-1 ring-violet-500' : '',
                                      )}
                                    >
                                      {cleaner.initials}
                                    </div>
                                  )}
                                  <p
                                    className="w-full truncate px-0.5 text-sm font-semibold leading-tight text-gray-900"
                                    title={cleaner.name}
                                  >
                                    {cleaner.name}
                                  </p>
                                  {cleaner.rating > 0 ? (
                                    <StarRowCompact rating={cleaner.rating} className="justify-center" />
                                  ) : (
                                    <span className="text-[10px] text-gray-400">New</span>
                                  )}
                                  {tag ? (
                                    <span className="rounded-full bg-violet-100/90 px-2 py-0.5 text-[10px] font-semibold leading-none text-violet-700">
                                      {tag}
                                    </span>
                                  ) : null}
                                  <p className="text-[10px] leading-tight text-gray-500">
                                    Available at your time
                                  </p>
                                  <span
                                    className={cn(
                                      'mt-0.5 text-[10px] font-bold uppercase tracking-wide',
                                      isSelected ? 'text-violet-700' : 'text-gray-400',
                                    )}
                                  >
                                    {isSelected ? 'Selected' : 'Tap to select'}
                                  </span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </BookingFlowLayout>

      <StickyCTA
        totalLabel={pricingTotalZar > 0 ? formatZarSimple(pricingTotalZar) : undefined}
        buttonLabel="Review and pay"
        onClick={handleContinue}
        disabled={!isValid}
        helperText={attempted && !isValid ? 'Please select a cleaner to continue' : 'Trusted by 100+ homes in Cape Town'}
        priceSummary={pricingTotalZar > 0 ? mobileStickyPriceSummary : undefined}
        priceSummaryTitle="Price summary"
      />
    </div>
  );
}
