'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  Layers,
  PenLine,
  Warehouse,
  Trees,
  Sofa,
  AppWindow,
  Zap,
  MessageSquare,
  Phone,
  X,
} from 'lucide-react';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { cn } from '@/lib/utils';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { BookingSummary } from '@/components/booking/booking-summary';
import { QuantityAddonModal } from '@/components/QuantityAddonModal';
import {
  BOOKING_DEFAULT_CITY,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_HREF,
  SUPPORT_WHATSAPP_URL,
} from '@/lib/contact';
import { isQuantityAddonTile } from '@/lib/quantity-addons';
import {
  BOOKING_TIME_SLOT_DEFS,
  MAX_BOOKINGS_PER_TIME_SLOT,
} from '@/lib/booking-time-slots';
import { useBookingSlotOccupancy } from '@/lib/use-booking-slot-occupancy';
import {
  getAvailabilityStyle,
  getAvailabilityUrgencyLabel,
} from '@/lib/booking-slot-availability-styles';
import StickyBookingBar from '@/components/StickyBookingBar';
import { useBookingAbVariant } from '@/hooks/use-booking-ab-variant';

type Extra = {
  id: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  price: number;
};
type TimeSlotWithAvailability = {
  id: string;
  label: string;
  booked: number;
  capacity: number;
  available: boolean;
  remaining: number;
};

function labelForBookingSlotId(id: string): string {
  return BOOKING_TIME_SLOT_DEFS.find((d) => d.id === id)?.label ?? id;
}

/** Maps UI extra ids to `BookingFormData.extras` ids (deep / move services). */
const EXTRA_UI_ID_TO_BOOKING: Record<string, string> = {
  carpet: 'carpet_deep',
  ceiling: 'ceiling',
  garage: 'garage',
  balcony: 'balcony',
  couch: 'couch',
  windows: 'exterior_windows',
};

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const EXTRAS: Extra[] = [
  {
    id: 'carpet',
    icon: <Layers size={26} />,
    label: 'Carpet',
    sublabel: 'Add-on',
    price: 150,
  },
  {
    id: 'ceiling',
    icon: <PenLine size={26} />,
    label: 'Ceiling',
    sublabel: 'Add-on',
    price: 120,
  },
  {
    id: 'garage',
    icon: <Warehouse size={26} />,
    label: 'Garage',
    sublabel: 'Add-on',
    price: 200,
  },
  {
    id: 'balcony',
    icon: <Trees size={26} />,
    label: 'Balcony',
    sublabel: 'Add-on',
    price: 100,
  },
  {
    id: 'couch',
    icon: <Sofa size={26} />,
    label: 'Couch',
    sublabel: 'Add-on',
    price: 180,
  },
  {
    id: 'windows',
    icon: <AppWindow size={26} />,
    label: 'Windows',
    sublabel: 'Add-on',
    price: 130,
  },
];

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isToday = (date: Date) => isSameDay(date, TODAY);
const formatSelectedDate = (date: Date) =>
  date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateStr(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d);
}

/** Furthest day (inclusive) from today that can be booked in this UI. */
const MAX_BOOKING_DAYS_FROM_TODAY = 365;

function daysFromTodayStart(d: Date): number {
  const a = new Date(TODAY);
  const b = new Date(d);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function isAllowedBookingDate(parsed: Date): boolean {
  const n = daysFromTodayStart(parsed);
  return n >= 0 && n <= MAX_BOOKING_DAYS_FROM_TODAY;
}

/** First day index (0 = today) of a 7-day row that contains `parsed`. */
function offsetForDateToBeVisible(parsed: Date): number {
  const n = daysFromTodayStart(parsed);
  if (n < 0) return 0;
  return Math.floor(n / 7) * 7;
}

/** Seven consecutive days starting `offset` days after today (offset is multiple of 7). */
function getSevenDaysStartingOffset(offsetFromToday: number): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + offsetFromToday + i);
    return d;
  });
}

function formatWeekRangeLabel(dates: Date[]): string {
  if (dates.length === 0) return '';
  const a = dates[0];
  const b = dates[dates.length - 1];
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return `${a.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export interface BookingStep2ScheduleProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  onBack: () => void;
  onContinue: () => void;
  pricing: {
    basePrice: number;
    bedroomAdd: number;
    bathroomAdd: number;
    extraRoomAdd: number;
    extrasTotal: number;
    total: number;
  };
  serviceTitle: string;
  /** Deep / Move / Standard / Airbnb: add-on tiles from form-data API. Pass `[]` when catalog is empty — do not omit (omitting falls back to legacy static tiles for Deep/Move). */
  addonTilesFromPricing?: { id: string; label: string; price: number; icon: React.ReactNode }[];
}

export function BookingStep2Schedule({
  data,
  setData,
  onBack,
  onContinue,
  pricing,
  serviceTitle,
  addonTilesFromPricing,
}: BookingStep2ScheduleProps) {
  const [weekStartOffset, setWeekStartOffset] = useState(() => {
    const parsed = parseDateStr(data.date);
    return parsed && isAllowedBookingDate(parsed) ? offsetForDateToBeVisible(parsed) : 0;
  });
  const selectableDates = useMemo(() => getSevenDaysStartingOffset(weekStartOffset), [weekStartOffset]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => parseDateStr(data.date));
  const [selectedTime, setSelectedTime] = useState<string | null>(() => (data.time ? data.time : null));

  const [quantityModal, setQuantityModal] = useState<{
    uiId: string;
    label: string;
    price: number;
  } | null>(null);

  const addonTiles = useMemo(() => {
    // Always use API-driven tiles from `/api/booking/form-data` only — never fall back to legacy static
    // EXTRAS (would show Balcony etc. after admins disable them in pricing_config).
    if (addonTilesFromPricing !== undefined) {
      return addonTilesFromPricing.map((t) => ({
        ...t,
        sublabel: 'Add-on' as const,
      }));
    }
    return [] as typeof EXTRAS;
  }, [addonTilesFromPricing, data.service]);

  const showEnhanceSection =
    addonTiles.length > 0 &&
    (data.service === 'deep' ||
      data.service === 'move' ||
      data.service === 'standard' ||
      data.service === 'airbnb');

  const selectedAddonUiIds = useMemo(() => {
    if (data.service === 'standard' || data.service === 'airbnb') {
      return data.extras.filter((id) => addonTiles.some((t) => t.id === id));
    }
    if (data.service === 'deep' || data.service === 'move') {
      return addonTiles
        .filter((t) => data.extras.includes(EXTRA_UI_ID_TO_BOOKING[t.id] ?? t.id))
        .map((t) => t.id);
    }
    return [];
  }, [data.service, data.extras, addonTiles]);

  const addonsLine = pricing.bedroomAdd + pricing.bathroomAdd + pricing.extraRoomAdd;
  const totalEstimate = pricing.total;
  const canContinue = selectedDate !== null && selectedTime !== null;

  const selectedDateStr = selectedDate ? toDateStr(selectedDate) : null;

  const slotDispatchContext = useMemo(
    () => ({
      suburb: data.workingArea?.trim() || '',
      city: BOOKING_DEFAULT_CITY,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      extras: data.extras,
      extrasQuantities: data.extrasQuantities,
    }),
    [data.workingArea, data.bedrooms, data.bathrooms, data.extras, data.extrasQuantities]
  );

  const slotOcc = useBookingSlotOccupancy(selectedDateStr, slotDispatchContext);
  const { variant: abVariant, track: trackAb } = useBookingAbVariant();
  const abLabelVariant = abVariant ?? 'A';

  const timeSlots = useMemo((): TimeSlotWithAvailability[] => {
    return BOOKING_TIME_SLOT_DEFS.map((def) => {
      if (slotOcc.status !== 'success') {
        return {
          ...def,
          booked: 0,
          capacity: 0,
          available: false,
          remaining: 0,
        };
      }
      const booked = slotOcc.counts[def.id] ?? 0;
      const remaining = slotOcc.remaining[def.id] ?? 0;
      const cap =
        slotOcc.eligibleCleaners != null && slotOcc.eligibleCleaners > 0
          ? slotOcc.eligibleCleaners
          : MAX_BOOKINGS_PER_TIME_SLOT;
      return {
        ...def,
        booked,
        capacity: cap,
        available: remaining > 0,
        remaining,
      };
    });
  }, [slotOcc.status, slotOcc.counts, slotOcc.remaining, slotOcc.eligibleCleaners]);

  const firstAvailableSlotId = useMemo(() => {
    if (slotOcc.status !== 'success') return null;
    for (const def of BOOKING_TIME_SLOT_DEFS) {
      if ((slotOcc.remaining[def.id] ?? 0) > 0) return def.id;
    }
    return null;
  }, [slotOcc.status, slotOcc.remaining]);

  useEffect(() => {
    if (
      slotOcc.status !== 'success' ||
      selectedTime != null ||
      !firstAvailableSlotId
    ) {
      return;
    }
    setSelectedTime(firstAvailableSlotId);
  }, [slotOcc.status, selectedTime, firstAvailableSlotId]);

  useEffect(() => {
    if (selectedTime) trackAb('slot_selected');
  }, [selectedTime, trackAb]);

  useEffect(() => {
    if (slotOcc.status !== 'success' || !selectedTime) return;
    const rem = slotOcc.remaining[selectedTime] ?? 0;
    if (rem <= 0) {
      setSelectedTime(null);
      setData((prev) => ({ ...prev, time: '' }));
    }
  }, [slotOcc.status, slotOcc.remaining, selectedTime, setData]);

  const canGoDatePrev = weekStartOffset > 0;
  const canGoDateNext = weekStartOffset + 13 <= MAX_BOOKING_DAYS_FROM_TODAY;

  useEffect(() => {
    const parsed = parseDateStr(data.date);
    if (!parsed) {
      setSelectedDate(null);
      setSelectedTime(data.time || null);
      return;
    }
    if (!isAllowedBookingDate(parsed)) {
      setData((prev) => ({ ...prev, date: '', time: '' }));
      setSelectedDate(null);
      setSelectedTime(null);
      setWeekStartOffset(0);
      return;
    }
    setSelectedDate(parsed);
    setSelectedTime(data.time || null);
    setWeekStartOffset(offsetForDateToBeVisible(parsed));
  }, [data.date, data.time, setData]);

  useEffect(() => {
    if (data.service !== 'standard' && data.service !== 'airbnb') return;
    setData((prev) => {
      if (prev.scheduleEquipmentPref === 'bring' || prev.scheduleEquipmentPref === 'own') return prev;
      return { ...prev, scheduleEquipmentPref: 'own' };
    });
  }, [data.service, setData]);

  /** Restore equipment charge alignment when extras were loaded from session storage */
  useEffect(() => {
    if (data.service !== 'standard' && data.service !== 'airbnb') return;
    if (!data.extras.includes('equipment')) return;
    setData((prev) => {
      if (prev.scheduleEquipmentPref === 'bring') return prev;
      return { ...prev, scheduleEquipmentPref: 'bring' };
    });
  }, [data.service, data.extras, setData]);

  const toggleExtra = (id: string) => {
    if (data.service === 'standard' || data.service === 'airbnb') {
      setData((prev) => {
        const has = prev.extras.includes(id);
        const nextExtras = has ? prev.extras.filter((e) => e !== id) : [...prev.extras, id];
        const nextEq = { ...prev.extrasQuantities };
        if (has) {
          delete nextEq[id];
        }
        if (id === 'equipment') {
          return {
            ...prev,
            extras: nextExtras,
            extrasQuantities: nextEq,
            scheduleEquipmentPref: has ? 'own' : 'bring',
          };
        }
        return { ...prev, extras: nextExtras, extrasQuantities: nextEq };
      });
      return;
    }
    if (data.service === 'deep' || data.service === 'move') {
      const storageKey = EXTRA_UI_ID_TO_BOOKING[id] ?? id;
      setData((prev) => {
        const has = prev.extras.includes(storageKey);
        if (has) {
          const nextEq = { ...prev.extrasQuantities };
          delete nextEq[storageKey];
          return { ...prev, extras: prev.extras.filter((e) => e !== storageKey), extrasQuantities: nextEq };
        }
        return { ...prev, extras: [...prev.extras, storageKey] };
      });
    }
  };

  const removeQuantityAddonByUiId = (uiId: string) => {
    const storageKey = EXTRA_UI_ID_TO_BOOKING[uiId] ?? uiId;
    setData((prev) => {
      const without = prev.extras.filter((e) => e !== storageKey);
      const nextEq = { ...prev.extrasQuantities };
      delete nextEq[storageKey];
      return { ...prev, extras: without, extrasQuantities: nextEq };
    });
  };

  const confirmQuantityAddon = (qty: number) => {
    if (!quantityModal) return;
    const storageKey = EXTRA_UI_ID_TO_BOOKING[quantityModal.uiId] ?? quantityModal.uiId;
    setData((prev) => {
      const without = prev.extras.filter((e) => e !== storageKey);
      const nextEq = { ...prev.extrasQuantities };
      delete nextEq[storageKey];
      if (qty <= 0) {
        return { ...prev, extras: without, extrasQuantities: nextEq };
      }
      return {
        ...prev,
        extras: [...without, storageKey],
        extrasQuantities: { ...nextEq, [storageKey]: qty },
      };
    });
    setQuantityModal(null);
  };

  const handleAddonTileClick = (extra: { id: string; label: string; price: number }) => {
    const qtyServices =
      data.service === 'deep' ||
      data.service === 'move' ||
      data.service === 'standard' ||
      data.service === 'airbnb';
    if (qtyServices && isQuantityAddonTile(extra.id)) {
      setQuantityModal({ uiId: extra.id, label: extra.label, price: extra.price });
      return;
    }
    toggleExtra(extra.id);
  };

  const handleDateSelect = (date: Date) => {
    if (!isAllowedBookingDate(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const goDatePrev = () => {
    if (!canGoDatePrev) return;
    setWeekStartOffset((o) => Math.max(0, o - 7));
  };

  const goDateNext = () => {
    if (!canGoDateNext) return;
    setWeekStartOffset((o) => o + 7);
  };

  const handleContinue = () => {
    if (!canContinue || !selectedDate || !selectedTime) return;
    trackAb('continue_step2');
    setData((prev) => ({
      ...prev,
      date: toDateStr(selectedDate),
      time: selectedTime,
    }));
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
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Shalean Cleaning Services
            </p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Extras & Schedule</h1>
          </div>
        </div>

        <BookingFlowStepIndicator activeStep={2} />
      </div>

      <BookingFlowLayout
        className={cn(selectedTime ? 'pb-24 lg:pb-8' : 'pb-8 lg:pb-8')}
        sidebar={
          <BookingSummary
            mode="preview"
            step={2}
            serviceTitle={serviceTitle}
            propertySummary={`${data.bedrooms} bed · ${data.bathrooms} bath${data.workingArea ? ` · ${data.workingArea}` : ''}`}
            extrasSummary={
              selectedAddonUiIds.length === 0
                ? undefined
                : selectedAddonUiIds
                    .map((id) => addonTiles.find((e) => e.id === id)?.label)
                    .filter(Boolean)
                    .join(', ')
            }
            totalZar={totalEstimate}
            details={
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{serviceTitle}</span>
                  <span className="font-semibold text-gray-800">R {pricing.basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Home size & add-ons</span>
                  <span className="font-semibold text-gray-800">R {addonsLine.toLocaleString()}</span>
                </div>

                <AnimatePresence>
                  {selectedAddonUiIds.map((id) => {
                    const extra = addonTiles.find((e) => e.id === id);
                    if (!extra) return null;
                    const deepMove = data.service === 'deep' || data.service === 'move';
                    const storageKey = EXTRA_UI_ID_TO_BOOKING[id] ?? id;
                    const isQty =
                      (deepMove ||
                        data.service === 'standard' ||
                        data.service === 'airbnb') &&
                      isQuantityAddonTile(id);
                    const q = isQty ? (data.extrasQuantities[storageKey] ?? 1) : 1;
                    const lineZar = isQty ? extra.price * q : extra.price;
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-between text-sm text-gray-600 overflow-hidden"
                      >
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                          {extra.label}
                          {deepMove ? ' Cleaning' : ''}
                          {isQty && q > 1 ? <span className="text-violet-500">×{q}</span> : null}
                        </span>
                        <span className="font-semibold text-violet-600">+R{lineZar.toLocaleString('en-ZA')}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <div className="border-t border-gray-100 pt-3 mt-1">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Need help?</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={SUPPORT_WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-emerald-50/80 px-3 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100/80 transition-colors"
                    >
                      <MessageSquare size={16} className="text-emerald-600 flex-shrink-0" aria-hidden />
                      WhatsApp us
                    </a>
                    <a
                      href={SUPPORT_PHONE_HREF}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <Phone size={16} className="text-violet-600 flex-shrink-0" aria-hidden />
                      Call {SUPPORT_PHONE_DISPLAY}
                    </a>
                  </div>
                </div>
              </>
            }
            footer={
              <>
                <motion.button
                  type="button"
                  onClick={handleContinue}
                  animate={canContinue ? { opacity: 1 } : { opacity: 0.45 }}
                  whileTap={canContinue ? { scale: 0.97 } : {}}
                  disabled={!canContinue}
                  className={[
                    'w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 mt-1',
                    canContinue
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                  ].join(' ')}
                >
                  {canContinue ? (
                    <>
                      Continue to Step 3 <ArrowRight size={16} />
                    </>
                  ) : (
                    <>Pick a date & time to continue</>
                  )}
                </motion.button>

                <div className="flex flex-col gap-1.5 pt-1">
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
            after={
              <AnimatePresence>
                {(selectedDate || selectedTime) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2 transition-all duration-300 ease-in-out"
                  >
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Selection</p>
                    {selectedDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar size={14} className="text-violet-500" />
                        <span>{formatSelectedDate(selectedDate)}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={14} className="text-violet-500" />
                        <span>{labelForBookingSlotId(selectedTime)}</span>
                      </div>
                    )}
                    {!selectedTime && selectedDate && (
                      <p className="text-xs text-amber-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                        Still need a start time
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            }
          />
        }
      >
          <p className="text-xs font-bold tracking-widest text-violet-600 uppercase">Step 2 of 4</p>

          {showEnhanceSection && (
            <div className="relative z-10 bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                  <Zap size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Enhance Your Service</h2>
                  <p className="text-sm text-gray-500">
                    Additional services — optional; prices follow your live estimate (database rates)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pointer-events-auto">
                {addonTiles.map((extra) => {
                  const isSelected = selectedAddonUiIds.includes(extra.id);
                  const storageKey = EXTRA_UI_ID_TO_BOOKING[extra.id] ?? extra.id;
                  const isQtyTile =
                    (data.service === 'deep' ||
                      data.service === 'move' ||
                      data.service === 'standard' ||
                      data.service === 'airbnb') &&
                    isQuantityAddonTile(extra.id);
                  const unitQty =
                    isQtyTile && isSelected ? (data.extrasQuantities[storageKey] ?? 1) : 1;
                  const lineTotalZar = isQtyTile ? extra.price * unitQty : extra.price;
                  return (
                    <div key={extra.id} className="relative">
                      {isSelected && isQtyTile && (
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          aria-label={`Remove ${extra.label} from booking`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeQuantityAddonByUiId(extra.id);
                          }}
                        >
                          <X size={14} strokeWidth={2.5} aria-hidden />
                        </button>
                      )}
                    <motion.button
                      type="button"
                      onClick={() => handleAddonTileClick(extra)}
                      onPointerDown={(e) => e.stopPropagation()}
                      whileTap={{ scale: 0.94 }}
                      className={[
                        'w-full flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 cursor-pointer transition-all duration-200',
                        isSelected
                          ? 'border-violet-500 bg-violet-50 shadow-sm shadow-violet-100'
                          : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/40',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors',
                          isSelected ? 'border-violet-500 text-violet-600' : 'border-gray-300 text-gray-500',
                        ].join(' ')}
                      >
                        {extra.icon}
                      </div>
                      <div className="text-center leading-tight">
                        <p
                          className={['text-xs font-semibold', isSelected ? 'text-violet-700' : 'text-gray-700'].join(
                            ' '
                          )}
                        >
                          {extra.label}
                        </p>
                        <p className="text-[10px] text-gray-400">{extra.sublabel}</p>
                      </div>
                      {isSelected && isQtyTile && (
                        <span className="text-xs text-violet-600 font-semibold">{unitQty} selected</span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                          +R{lineTotalZar.toLocaleString('en-ZA')}
                        </span>
                      )}
                    </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Calendar size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Schedule</h2>
                <p className="text-sm text-gray-500">Pick a date and preferred start time</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Date</span>
              {selectedDate && (
                <span className="ml-auto max-w-[min(100%,11rem)] sm:max-w-none text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200 truncate text-right">
                  {formatSelectedDate(selectedDate)}
                </span>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/40">
              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <button
                  type="button"
                  onClick={goDatePrev}
                  disabled={!canGoDatePrev}
                  aria-label="Previous dates"
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} className="text-gray-700" />
                </button>
                <div className="min-w-0 text-center flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pick a week</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{formatWeekRangeLabel(selectableDates)}</p>
                </div>
                <button
                  type="button"
                  onClick={goDateNext}
                  disabled={!canGoDateNext}
                  aria-label="Next dates"
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} className="text-gray-700" />
                </button>
              </div>

              <div className="p-3 sm:p-4">
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {selectableDates.map((cellDate) => {
                    const dow = DAYS_OF_WEEK[cellDate.getDay()];
                    const dayNum = cellDate.getDate();
                    const todayCell = isToday(cellDate);
                    const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;
                    return (
                      <motion.button
                        key={toDateStr(cellDate)}
                        type="button"
                        onClick={() => handleDateSelect(cellDate)}
                        whileTap={{ scale: 0.94 }}
                        className={[
                          'flex flex-col items-center justify-center rounded-xl py-2 px-0.5 sm:py-3 sm:px-2 min-h-[3.5rem] sm:min-h-[4.25rem] transition-all duration-150',
                          isSelected
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                            : todayCell
                              ? 'ring-2 ring-violet-400 bg-white text-violet-700 font-bold hover:bg-violet-50'
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'text-[9px] sm:text-[10px] font-bold tracking-wider',
                            isSelected ? 'text-violet-100' : 'text-gray-400',
                          ].join(' ')}
                        >
                          {dow}
                        </span>
                        <span className="text-base sm:text-lg font-bold tabular-nums leading-tight mt-0.5">{dayNum}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Start Time</span>
              {selectedDate && (
                <span className="ml-auto text-xs text-gray-400">
                  {selectedTime ? (
                    <span className="text-violet-600 font-semibold">
                      {labelForBookingSlotId(selectedTime)}
                    </span>
                  ) : (
                    'Choose a time below'
                  )}
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!selectedDate ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 flex flex-col items-center gap-2"
                >
                  <Calendar size={28} className="text-gray-300" />
                  <p className="text-sm text-gray-400 font-medium">Select a date first to see available times</p>
                </motion.div>
              ) : (
                <motion.div
                  key="slots"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  {slotOcc.status === 'error' && slotOcc.errorMessage && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      {slotOcc.errorMessage}
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {timeSlots.map((slot) => {
                      const showFullStyle =
                        slotOcc.status === 'success' && !slot.available;
                      const occupancyReady = slotOcc.status === 'success';
                      const subline =
                        slotOcc.status === 'loading'
                          ? 'Loading…'
                          : slotOcc.status === 'error'
                            ? '—'
                            : getAvailabilityUrgencyLabel(slot.remaining, abLabelVariant);
                      const highlightLast =
                        occupancyReady && slot.available && slot.remaining === 1;
                      const isRecommended =
                        occupancyReady &&
                        slot.available &&
                        firstAvailableSlotId === slot.id;
                      return (
                        <motion.button
                          key={slot.id}
                          type="button"
                          onClick={() => slot.available && setSelectedTime(slot.id)}
                          disabled={!slot.available}
                          whileTap={slot.available ? { scale: 0.93 } : {}}
                          className={[
                            'py-2.5 px-2 rounded-xl text-xs font-semibold border-2',
                            slot.available && occupancyReady
                              ? 'hover:scale-105 transition-all duration-200 ease-out'
                              : 'transition-all duration-200 ease-out',
                            highlightLast ? 'ring-2 ring-red-400' : '',
                            showFullStyle
                              ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                              : !slot.available
                                ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-80'
                                : selectedTime === slot.id
                                  ? 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-200'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50',
                          ].join(' ')}
                        >
                          {isRecommended && (
                            <span
                              className={[
                                'block text-[9px] font-bold uppercase tracking-wide mb-0.5 leading-tight',
                                selectedTime === slot.id && slot.available
                                  ? 'text-violet-100'
                                  : 'text-violet-600',
                              ].join(' ')}
                            >
                              Recommended
                            </span>
                          )}
                          {slot.label}
                          <span className="block mt-0.5 no-underline">
                            {occupancyReady ? (
                              <span
                                className={`text-[10px] leading-tight px-2 py-1 rounded font-normal inline-block text-center ${getAvailabilityStyle(slot.remaining)}`}
                              >
                                {subline}
                              </span>
                            ) : (
                              <span className="block text-[9px] font-normal text-gray-400">{subline}</span>
                            )}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </BookingFlowLayout>

      <StickyBookingBar
        selectedTime={selectedTime}
        total={totalEstimate}
        onContinue={handleContinue}
        canContinue={canContinue}
      />

      {quantityModal && (
        <QuantityAddonModal
          addon={{
            id: quantityModal.uiId,
            name: quantityModal.label,
            price: quantityModal.price,
          }}
          inBooking={data.extras.includes(
            EXTRA_UI_ID_TO_BOOKING[quantityModal.uiId] ?? quantityModal.uiId
          )}
          initialQty={
            data.extras.includes(EXTRA_UI_ID_TO_BOOKING[quantityModal.uiId] ?? quantityModal.uiId)
              ? data.extrasQuantities[EXTRA_UI_ID_TO_BOOKING[quantityModal.uiId] ?? quantityModal.uiId] ?? 1
              : 1
          }
          onClose={() => setQuantityModal(null)}
          onConfirm={confirmQuantityAddon}
        />
      )}
    </div>
  );
}
