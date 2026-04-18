'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking } from './types';
import { useProfile } from './hooks';
import { BOOKING_TIME_SLOT_DEFS } from '@/lib/booking-time-slots';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import { useBookingSlotOccupancy } from '@/lib/use-booking-slot-occupancy';
import {
  getAvailabilityStyle,
  getAvailabilityUrgencyLabel,
} from '@/lib/booking-slot-availability-styles';
import { useBookingAbVariant } from '@/hooks/use-booking-ab-variant';
import { aggregateExtraIdsToQuantities } from '@/shared/booking-engine/dashboard-pricing-bridge';
import {
  MAX_BOOKING_DAYS_FROM_TODAY,
  getSevenDaysStartingOffset,
  offsetForDateToBeVisible,
  toDateStr,
  parseDateStr,
  isAllowedBookingDate,
  formatWeekRangeLabel,
} from '@/shared/booking-engine/booking-dates';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import { normalizeBookingTimeToSlotId } from '@/lib/booking-time-slots';

const TEAM_OPTIONS = ['Team A', 'Team B', 'Team C'] as const;

const RESCHEDULE_STEPS: Array<{ id: number; label: string }> = [
  { id: 1, label: 'Date & Time' },
  { id: 2, label: 'Cleaner / Team' },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
      {RESCHEDULE_STEPS.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
          <div
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300',
              currentStep > s.id
                ? 'bg-blue-600 text-white'
                : currentStep === s.id
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-200 text-gray-400'
            )}
          >
            {currentStep > s.id ? <CheckCircle2 className="w-3 h-3" /> : <span>{s.id}</span>}
          </div>
          <span
            className={cn(
              'text-[11px] font-semibold transition-colors',
              currentStep === s.id
                ? 'text-blue-600'
                : currentStep > s.id
                  ? 'text-gray-400'
                  : 'text-gray-300'
            )}
          >
            {s.label}
          </span>
          {idx < RESCHEDULE_STEPS.length - 1 && (
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

interface RescheduleDatePickerModalProps {
  booking: Booking;
  onConfirm: (
    bookingId: string,
    newDate: string,
    newTime: string,
    cleanerId: string | null,
    teamName: string | null
  ) => void | Promise<void>;
  onClose: () => void;
}

export function RescheduleDatePickerModal({
  booking,
  onConfirm,
  onClose,
}: RescheduleDatePickerModalProps) {
  const { customerAddressParts } = useProfile();
  const bookingIso = booking.bookingDateIso && /^\d{4}-\d{2}-\d{2}$/.test(booking.bookingDateIso)
    ? booking.bookingDateIso
    : toDateStr(new Date());

  const [weekStartOffset, setWeekStartOffset] = useState(() => {
    const parsed = parseDateStr(bookingIso);
    return parsed && isAllowedBookingDate(parsed) ? offsetForDateToBeVisible(parsed) : 0;
  });
  const selectableDates = useMemo(() => getSevenDaysStartingOffset(weekStartOffset), [weekStartOffset]);

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => bookingIso);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(() => {
    const raw = booking.bookingTimeSlotId?.trim();
    if (raw && /^\d{2}:\d{2}$/.test(raw)) return raw;
    const t = normalizeBookingTimeToSlotId(booking.time) || '';
    return t || null;
  });
  const [step, setStep] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [apiCleaners, setApiCleaners] = useState<ApiCleaner[]>([]);
  const [cleanersLoading, setCleanersLoading] = useState(false);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(() =>
    booking.cleanerId && /^[0-9a-f-]{36}$/i.test(booking.cleanerId) ? booking.cleanerId : null
  );
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(() =>
    booking.teamName && TEAM_OPTIONS.includes(booking.teamName as (typeof TEAM_OPTIONS)[number])
      ? booking.teamName
      : null
  );
  const [bookedTeams, setBookedTeams] = useState<string[]>([]);

  const serviceRaw = booking.serviceTypeRaw || booking.service;
  const requiresTeam =
    booking.requiresTeam === true ||
    serviceRaw === 'Deep' ||
    serviceRaw === 'Move In/Out';

  const extrasIds = booking.extrasIds ?? [];
  const extrasQuantities = booking.extrasQuantities ?? aggregateExtraIdsToQuantities(extrasIds);
  const bedrooms = booking.bedrooms ?? 2;
  const bathrooms = booking.bathrooms ?? 2;

  const durationMinutes = useMemo(() => {
    if (booking.durationMinutes && booking.durationMinutes >= 30) return booking.durationMinutes;
    return computeBookingDurationMinutes({
      bedrooms,
      bathrooms,
      extras: extrasIds,
      extrasQuantities,
    });
  }, [booking.durationMinutes, bedrooms, bathrooms, extrasIds, extrasQuantities]);

  const slotDispatchContext = useMemo(
    () => ({
      suburb: customerAddressParts?.suburb?.trim() ?? '',
      city: customerAddressParts?.city?.trim() || BOOKING_DEFAULT_CITY,
      bedrooms,
      bathrooms,
      extras: extrasIds,
      extrasQuantities,
    }),
    [customerAddressParts?.suburb, customerAddressParts?.city, bedrooms, bathrooms, extrasIds, extrasQuantities]
  );

  const slotOcc = useBookingSlotOccupancy(selectedDateStr, slotDispatchContext);
  const { variant: abVariant } = useBookingAbVariant();

  const timeSlots = useMemo(() => {
    return BOOKING_TIME_SLOT_DEFS.map((def) => {
      if (slotOcc.status !== 'success') {
        return { id: def.id, time: def.label, available: false, remaining: 0 };
      }
      const remaining = slotOcc.remaining[def.id] ?? 0;
      return {
        id: def.id,
        time: def.label,
        available: remaining > 0,
        remaining,
      };
    });
  }, [slotOcc.status, slotOcc.remaining]);

  useEffect(() => {
    if (!selectedDateStr || !requiresTeam) return;
    let cancelled = false;
    const svc = serviceRaw === 'Move In/Out' ? 'Move In/Out' : 'Deep';
    fetch(
      `/api/teams/availability?date=${encodeURIComponent(selectedDateStr)}&service=${encodeURIComponent(svc)}&exclude_booking_id=${encodeURIComponent(booking.id)}`
    )
      .then((r) => r.json())
      .then((j: { ok?: boolean; bookedTeams?: string[] }) => {
        if (!cancelled && j?.ok && Array.isArray(j.bookedTeams)) setBookedTeams(j.bookedTeams);
      })
      .catch(() => {
        if (!cancelled) setBookedTeams([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDateStr, requiresTeam, serviceRaw]);

  useEffect(() => {
    if (requiresTeam || !selectedDateStr || !selectedSlotId || !customerAddressParts) {
      setApiCleaners([]);
      return;
    }
    let cancelled = false;
    setCleanersLoading(true);
    const params = new URLSearchParams({
      date: selectedDateStr,
      city: customerAddressParts.city?.trim() || BOOKING_DEFAULT_CITY,
      suburb: customerAddressParts.suburb,
      time: selectedSlotId,
      exclude_booking_id: booking.id,
    });
    params.set('duration_minutes', String(durationMinutes));
    fetch(`/api/cleaners/available?${params.toString()}`)
      .then((res) => res.json())
      .then((json: { ok?: boolean; cleaners?: ApiCleaner[] }) => {
        if (cancelled) return;
        setApiCleaners(json.ok && Array.isArray(json.cleaners) ? json.cleaners : []);
      })
      .catch(() => {
        if (!cancelled) setApiCleaners([]);
      })
      .finally(() => {
        if (!cancelled) setCleanersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    requiresTeam,
    selectedDateStr,
    selectedSlotId,
    customerAddressParts,
    durationMinutes,
    booking.id,
  ]);

  const canGoDatePrev = weekStartOffset > 0;
  const canGoDateNext = weekStartOffset + 7 <= MAX_BOOKING_DAYS_FROM_TODAY;

  const canGoToStep2 =
    Boolean(selectedDateStr && selectedSlotId) &&
    (slotOcc.status !== 'success' || (timeSlots.find((s) => s.id === selectedSlotId)?.available ?? false));

  const canConfirm = requiresTeam
    ? Boolean(selectedTeamName)
    : Boolean(selectedCleanerId && /^[0-9a-f-]{36}$/i.test(selectedCleanerId));

  const handleConfirm = async () => {
    if (!selectedDateStr || !selectedSlotId) return;
    if (requiresTeam && !selectedTeamName) return;
    if (!requiresTeam && !selectedCleanerId) return;
    setConfirming(true);
    try {
      await onConfirm(
        booking.id,
        selectedDateStr,
        selectedSlotId,
        requiresTeam ? null : selectedCleanerId,
        requiresTeam ? selectedTeamName : null
      );
      setConfirming(false);
      setConfirmed(true);
      setTimeout(onClose, 1400);
    } catch {
      setConfirming(false);
    }
  };

  const weekLabel = formatWeekRangeLabel(selectableDates);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900">Reschedule</p>
              <p className="text-xs text-gray-400 mt-0.5">{booking.service}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <StepIndicator currentStep={step} />

        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-base font-extrabold text-gray-900 mb-1">Booking updated</p>
              <p className="text-xs text-gray-500">Your new schedule has been saved.</p>
            </motion.div>
          ) : (
            <motion.div key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      disabled={!canGoDatePrev}
                      onClick={() => {
                        setWeekStartOffset((o) => Math.max(0, o - 7));
                        setSelectedDateStr(null);
                        setSelectedSlotId(null);
                      }}
                      className={cn(
                        'p-2 rounded-xl border',
                        canGoDatePrev ? 'border-gray-200 text-gray-700' : 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <p className="text-xs font-bold text-gray-600 text-center">{weekLabel}</p>
                    <button
                      type="button"
                      disabled={!canGoDateNext}
                      onClick={() => {
                        setWeekStartOffset((o) => o + 7);
                        setSelectedDateStr(null);
                        setSelectedSlotId(null);
                      }}
                      className={cn(
                        'p-2 rounded-xl border',
                        canGoDateNext ? 'border-gray-200 text-gray-700' : 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {selectableDates.map((d) => {
                      const iso = toDateStr(d);
                      const sel = selectedDateStr === iso;
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => {
                            setSelectedDateStr(iso);
                            setSelectedSlotId(null);
                          }}
                          className={cn(
                            'flex-shrink-0 flex flex-col items-center w-14 py-3 rounded-2xl border-2 transition-all',
                            sel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700'
                          )}
                        >
                          <span
                            className={cn(
                              'text-[10px] font-semibold',
                              sel ? 'text-blue-200' : 'text-gray-400'
                            )}
                          >
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}
                          </span>
                          <span className="text-lg font-extrabold leading-tight">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => slot.available && setSelectedSlotId(slot.id)}
                        className={cn(
                          'py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center min-h-[3.25rem]',
                          !slot.available
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                            : selectedSlotId === slot.id
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-200 text-gray-700'
                        )}
                      >
                        <span>{slot.time}</span>
                        {slotOcc.status === 'success' && (
                          <span
                            className={cn(
                              'text-[9px] font-normal mt-0.5 px-1 rounded',
                              getAvailabilityStyle(slot.remaining)
                            )}
                          >
                            {getAvailabilityUrgencyLabel(slot.remaining, abVariant ?? 'A')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {!customerAddressParts && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
                      Add your address in Profile so we can check availability for your area.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={!canGoToStep2}
                    onClick={() => setStep(2)}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-40"
                  >
                    Continue
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {requiresTeam ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Choose a crew for {serviceRaw}. Teams already booked on this date are unavailable.
                      </p>
                      {TEAM_OPTIONS.map((team) => {
                        const taken = bookedTeams.includes(team);
                        const disabled = taken;
                        return (
                          <button
                            key={team}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && setSelectedTeamName(team)}
                            className={cn(
                              'w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all',
                              disabled
                                ? 'opacity-40 cursor-not-allowed border-gray-100'
                                : selectedTeamName === team
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{team}</p>
                              <p className="text-xs text-gray-500">
                                {disabled ? 'Unavailable on this date' : 'Coordinated crew'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : cleanersLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : apiCleaners.length === 0 ? (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
                      No cleaners available for this slot. Try another date or time.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {apiCleaners.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCleanerId(c.id)}
                          className={cn(
                            'w-full rounded-2xl border-2 px-4 py-3 text-left transition-all',
                            selectedCleanerId === c.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <p className="text-sm font-bold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">
                            {c.specialties?.[0] || 'Professional cleaner'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!canConfirm || confirming}
                      onClick={() => void handleConfirm()}
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
