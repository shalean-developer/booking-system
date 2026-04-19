'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Star,
  ShieldCheck,
  AlertTriangle,
  Users,
  User,
  CalendarDays,
  Clock,
  MapPin,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import type { OptimalTeamResult } from '@/lib/team-optimizer';
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '@/lib/team-optimizer';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { BookingSummary } from '@/components/booking/booking-summary';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  /** Workload-based recommendation; pricing uses `data.numberOfCleaners` */
  optimalTeam: OptimalTeamResult;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_ASSIGN_ID = 'auto-assign';

const AVATAR_ROTATION = ['bg-pink-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-orange-500'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({
  id,
  icon,
  title,
  subtitle,
  badge,
  error,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  error?: boolean;
}) => (
  <div className="flex items-start justify-between gap-3 mb-5">
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <h2 id={id} className="text-base font-bold text-gray-900 leading-tight tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {badge}
      {error && (
        <motion.span
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1 text-xs text-red-500 font-semibold"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Required</span>
        </motion.span>
      )}
    </div>
  </div>
);

const StarRating = ({ rating, accentText }: { rating: number; accentText: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={cn(
          'w-3 h-3',
          s <= Math.round(rating) ? accentText : 'text-gray-200',
          s <= Math.round(rating) ? 'fill-current' : ''
        )}
      />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const ctaBtnRef = useRef<HTMLButtonElement>(null);

  const useTeams = isTeamService(data.service);
  const showCleanerList = data.service === 'standard' || data.service === 'airbnb';

  const selectedTeamSize = Math.min(
    MAX_TEAM_SIZE,
    Math.max(MIN_TEAM_SIZE, Math.round(data.numberOfCleaners ?? optimalTeam.teamSize))
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
    [apiCleaners, timeLabel]
  );

  /** Team (deep/move) bookings: no fake team cards — only auto-assign. Standard/Airbnb: API cleaners. */
  const canPickManual = showCleanerList;
  const needsCleanerFromApi = showCleanerList;
  const hasApiCleaners = mappedCleaners.length > 0;
  const isValid =
    !needsCleanerFromApi ||
    selectedId === AUTO_ASSIGN_ID ||
    (selectedId !== AUTO_ASSIGN_ID && mappedCleaners.some((c) => c.id === selectedId));

  const selectedName =
    selectedId === AUTO_ASSIGN_ID
      ? useTeams
        ? 'Cleaning team'
        : 'Auto-assigned'
      : mappedCleaners.find((c) => c.id === selectedId)?.name ?? '';

  const handleSelectAuto = () => {
    setData((p) => ({ ...p, cleanerId: '', teamId: '' }));
  };

  const handleSelectCleaner = (id: string) => {
    setData((p) => ({ ...p, cleanerId: id, teamId: '' }));
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

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Shalean Cleaning Services</p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Crew selection</h1>
          </div>
        </div>
        <BookingFlowStepIndicator activeStep={3} />
      </div>

      <BookingFlowLayout
        sidebar={
          <BookingSummary
            mode="preview"
            step={3}
            serviceTitle={serviceTitle}
            propertySummary={`${data.bedrooms} bed · ${data.bathrooms} bath · ${locationLabel}`}
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
            details={
              <div className="rounded-xl border border-gray-100 bg-gray-50/90 p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Price breakdown</p>
                <div className="space-y-2.5">
                  {pricing.dbPricingRows
                    .filter((r) => r.value !== 0)
                    .map((row) => (
                      <div key={row.id} className="flex justify-between items-start gap-3 text-sm">
                        <span className="text-gray-600">{row.label}</span>
                        <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0">
                          {formatZarSimple(row.value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            }
            detailRows={[
              { id: 'date', label: 'Date', value: dateLabel },
              { id: 'time', label: 'Time', value: timeLabel },
              { id: 'location', label: 'Location', value: locationLabel },
              { id: 'crew', label: 'Crew', value: selectedName },
            ]}
            footer={
              <>
                <motion.button
                  ref={ctaBtnRef}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                  transition={shaking ? { duration: 0.5 } : {}}
                  onClick={handleContinue}
                  className={cn(
                    'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ease-in-out',
                    isValid
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                  aria-disabled={!isValid}
                >
                  <span>Continue to Step 4</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                {attempted && !isValid && (
                  <p className="text-xs text-red-500 text-center mt-2">Please select a cleaner or team</p>
                )}

                <div className="flex flex-col gap-1.5 px-0.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    No payment required to book
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    Free cancellation up to 24 hrs before
                  </div>
                </div>
              </>
            }
          />
        }
      >
          <p className="text-xs font-bold tracking-widest text-violet-600 uppercase">Step 3 of 4</p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50/80 border border-gray-200 rounded-full px-3 py-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">{dateLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50/80 border border-gray-200 rounded-full px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">{timeLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50/80 border border-gray-200 rounded-full px-3 py-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">{locationLabel}</span>
              </div>
              <span className="inline-flex items-center text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                {formatZarSimple(pricingTotalZar)}
              </span>
            </div>
          </div>

          <section
            aria-labelledby="team-size-heading"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="team-size-heading"
                  className="text-base font-bold text-gray-900 leading-tight tracking-tight"
                >
                  Team size
                </h2>
                <p className="text-sm text-violet-700 font-medium mt-1">
                  Recommended: {optimalTeam.teamSize}{' '}
                  {optimalTeam.teamSize === 1 ? 'cleaner' : 'cleaners'} (
                  {optimalTeam.hoursPerCleaner.toFixed(1)} hours each)
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Based on your service and estimated workload (~{optimalTeam.totalWorkHours.toFixed(1)} hrs
                  total).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Number of cleaners">
              {Array.from({ length: MAX_TEAM_SIZE - MIN_TEAM_SIZE + 1 }, (_, i) => MIN_TEAM_SIZE + i).map(
                (n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTeamSize(n)}
                    className={cn(
                      'min-w-[2.5rem] px-3 py-2 rounded-xl text-sm font-bold border-2 transition-colors',
                      selectedTeamSize === n
                        ? 'border-violet-600 bg-violet-50 text-violet-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                    )}
                    aria-pressed={selectedTeamSize === n}
                  >
                    {n}
                  </button>
                )
              )}
            </div>

            <p className="text-xs text-gray-600">
              Your job: ~{hoursEachSelected.toFixed(1)} hours per cleaner with {selectedTeamSize}{' '}
              {selectedTeamSize === 1 ? 'cleaner' : 'cleaners'}.
            </p>

            {showLargerTeamWarning && (
              <div
                className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                role="status"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <span>
                  You chose more cleaners than recommended. Cost may be higher; we&apos;ll still do our
                  best to match your preference.
                </span>
              </div>
            )}

            {data.teamSizeUserOverride && selectedTeamSize !== optimalTeam.teamSize && (
              <button
                type="button"
                onClick={useRecommendedTeamSize}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 underline underline-offset-2"
              >
                Use recommended ({optimalTeam.teamSize} cleaners)
              </button>
            )}
          </section>

          <section aria-labelledby="crew-heading" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <SectionLabel
              id="crew-heading"
              icon={
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                  {useTeams ? (
                    <Users className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
              }
              title={useTeams ? 'Select a Cleaning Team' : 'Select a Cleaner'}
              subtitle={
                useTeams
                  ? 'Professional teams for deep and complex jobs'
                  : showCleanerList
                    ? 'Individual specialists matched to your service'
                    : 'We will assign the best available crew for your booking'
              }
              error={attempted && !isValid}
            />

            <div className="space-y-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectAuto}
                className={cn(
                  'w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer',
                  selectedId === AUTO_ASSIGN_ID
                    ? 'border-violet-500 bg-violet-50 shadow-sm shadow-violet-100'
                    : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/40'
                )}
                aria-pressed={selectedId === AUTO_ASSIGN_ID}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-200',
                      selectedId === AUTO_ASSIGN_ID ? 'bg-violet-600' : 'bg-gray-100'
                    )}
                  >
                    <Sparkles
                      className={cn(
                        'w-5 h-5',
                        selectedId === AUTO_ASSIGN_ID ? 'text-white' : 'text-gray-400'
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          'font-bold text-sm leading-tight',
                          selectedId === AUTO_ASSIGN_ID ? 'text-gray-900' : 'text-gray-800'
                        )}
                      >
                        Let us choose for you
                      </p>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                          selectedId === AUTO_ASSIGN_ID
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      We&apos;ll assign the highest-rated available cleaner{useTeams ? ' team' : ''} for
                      your slot.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current text-violet-600" />
                        <span className="text-xs font-semibold text-gray-700">Top rated</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-semibold text-gray-700">Fully insured</span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedId === AUTO_ASSIGN_ID && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                        className="flex-shrink-0 mt-0.5 text-violet-600"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>

              {canPickManual && (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                      or pick manually
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {needsCleanerFromApi && cleanersLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-gray-200 bg-white">
                      <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4" />
                      <p className="text-slate-500 text-sm">Loading available cleaners…</p>
                    </div>
                  ) : needsCleanerFromApi && !hasApiCleaners ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-800">No cleaners available for this time</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Try another date, time, or area — or continue with auto-assign.
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                          key="individuals"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                          className="space-y-3"
                        >
                          {mappedCleaners.map((cleaner) => {
                            const isSelected = selectedId === cleaner.id;
                            return (
                              <motion.button
                                key={cleaner.id}
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelectCleaner(cleaner.id)}
                                className={cn(
                                  'w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer',
                                  isSelected
                                    ? 'border-violet-500 bg-violet-50 shadow-sm shadow-violet-100'
                                    : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/40'
                                )}
                                aria-pressed={isSelected}
                              >
                                <div className="flex items-start gap-4">
                                  {cleaner.photo ? (
                                    <img
                                      src={cleaner.photo}
                                      alt=""
                                      className={cn(
                                        'flex-shrink-0 w-12 h-12 rounded-2xl object-cover transition-all duration-200',
                                        isSelected
                                          ? 'ring-2 ring-offset-2 ring-violet-500'
                                          : ''
                                      )}
                                    />
                                  ) : (
                                    <div
                                      className={cn(
                                        'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm transition-all duration-200',
                                        cleaner.avatarBg,
                                        isSelected
                                          ? 'ring-2 ring-offset-2 ring-violet-500'
                                          : ''
                                      )}
                                    >
                                      {cleaner.initials}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p
                                        className={cn(
                                          'font-bold text-sm leading-tight',
                                          isSelected ? 'text-gray-900' : 'text-gray-800'
                                        )}
                                      >
                                        {cleaner.name}
                                      </p>
                                    </div>

                                    {cleaner.speciality ? (
                                      <p className="text-[11px] text-gray-400 mt-0.5">{cleaner.speciality}</p>
                                    ) : null}

                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                                      <StarRating
                                        rating={cleaner.rating}
                                        accentText="text-violet-600"
                                      />
                                      <span className="text-xs font-bold text-gray-700">
                                        {Number(cleaner.rating).toFixed(1)}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {cleaner.reviewCount > 0
                                          ? `${cleaner.reviewCount} review${cleaner.reviewCount === 1 ? '' : 's'}`
                                          : 'No reviews yet'}
                                      </span>
                                      <span className="text-gray-300 text-xs">·</span>
                                      <span className="text-xs text-gray-400">
                                        {cleaner.jobCount > 0
                                          ? `${cleaner.jobCount} job${cleaner.jobCount === 1 ? '' : 's'} completed`
                                          : 'No completed jobs yet'}
                                      </span>
                                    </div>
                                    {cleaner.completionRate != null && cleaner.completionRate > 0 ? (
                                      <p className="text-[11px] text-gray-500 mt-0.5">
                                        Reliability {Math.round(cleaner.completionRate)}%
                                      </p>
                                    ) : null}

                                    <div className="mt-2">
                                      <span
                                        className={cn(
                                          'text-[11px] font-bold px-2.5 py-0.5 rounded-full',
                                          isSelected
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-gray-100 text-gray-500'
                                        )}
                                      >
                                        Your slot · {cleaner.slotTimeLabel}
                                      </span>
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                                        className="flex-shrink-0 mt-0.5 text-violet-600"
                                      >
                                        <CheckCircle2 className="w-5 h-5" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                    </AnimatePresence>
                  )}
                </>
              )}
            </div>
          </section>
      </BookingFlowLayout>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_32px_rgba(0,0,0,0.08)]">
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-4 space-y-0.5">
                  <p className="text-xs text-gray-500 font-medium">
                    <span>
                      {dateLabel} · {timeLabel}
                    </span>
                  </p>
                  <p className="text-xs font-semibold text-violet-600">{selectedName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <motion.p
                    key={pricingTotalZar}
                    initial={{ y: -4, opacity: 0.6 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-lg font-extrabold text-gray-900"
                  >
                    {formatZarSimple(pricingTotalZar)}
                  </motion.p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">estimated</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={shaking ? { duration: 0.5 } : {}}
            onClick={handleContinue}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200',
              isValid
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'
                : 'bg-gray-100 text-gray-400'
            )}
            aria-disabled={!isValid}
          >
            <span>Continue to Step 4</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          {attempted && !isValid && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 text-center mt-2"
            >
              <span>Please select a cleaner or team to continue</span>
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
