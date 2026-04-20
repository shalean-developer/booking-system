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
  Layers,
  PenLine,
  Warehouse,
  Trees,
  Sofa,
  AppWindow,
  Zap,
  X,
} from 'lucide-react';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { cn } from '@/lib/utils';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { BookingSummary } from '@/components/booking/booking-summary';
import { QuantityAddonModal } from '@/components/QuantityAddonModal';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import { isQuantityAddonTile } from '@/lib/quantity-addons';
import {
  BOOKING_TIME_SLOT_DEFS,
  MAX_BOOKINGS_PER_TIME_SLOT,
} from '@/lib/booking-time-slots';
import { useBookingSlotOccupancy } from '@/lib/use-booking-slot-occupancy';
import { useUnifiedAvailability, type UnifiedAvailabilityBody } from '@/lib/use-unified-availability';
import { wizardHasExtraCleaner } from '@/lib/pricing-mode';
import {
  getAvailabilityUrgencyLabel,
} from '@/lib/booking-slot-availability-styles';
import { getDateDemandBadge } from '@/lib/booking-date-badges';
import { StickyCTA } from '@/components/booking/mobile/sticky-cta';
import { TimeSlotPicker } from '@/components/booking/mobile/time-slot-picker';
import { StepLayout } from '@/components/booking/mobile/step-layout';
import { useBookingAbVariant } from '@/hooks/use-booking-ab-variant';
import {
  MAX_BOOKING_DAYS_FROM_TODAY,
  toDateStr,
  parseDateStr,
  daysFromTodayStart,
  isAllowedBookingDate,
  offsetForDateToBeVisible,
  getSevenDaysStartingOffset,
  formatWeekRangeLabel,
  formatSelectedDateLong,
} from '@/shared/booking-engine/booking-dates';

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
  recommended?: boolean;
};

function labelForBookingSlotId(id: string): string {
  return BOOKING_TIME_SLOT_DEFS.find((d) => d.id === id)?.label ?? id;
}

function formatDurationMinutesLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatYmdFriendly(dateYmd: string): string {
  const d = parseDateStr(dateYmd);
  if (!d) return dateYmd;
  return d.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatUnifiedSlotRangeLabel(start: string, end: string): string {
  return `${start} – ${end}`;
}

function parseSlotStartToMinutes(slotId: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slotId.trim());
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Compact "07:00" for slot buttons */
function formatSlotCompactTime(slotId: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slotId.trim());
  if (!m) return slotId;
  return `${String(m[1]).padStart(2, '0')}:${m[2]}`;
}

function formatCompactWeekday(d: Date) {
  return d.toLocaleDateString('en-ZA', { weekday: 'short' });
}

function formatCompactDayMonth(d: Date) {
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
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

// Keep Laundry / Ironing as simple toggles (no qty modal).
const NO_QUANTITY_MODAL_EXTRA_IDS = new Set<string>(['laundry', 'ironing']);

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

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isToday = (date: Date) => isSameDay(date, TODAY);

export interface BookingStep2ScheduleProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  onBack: () => void;
  onContinue: () => void;
  pricing: {
    total: number;
    /** Same line items as step 1 / checkout — engine-derived. */
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
  /** Deep / Move / Standard / Airbnb: add-on tiles from form-data API. Pass `[]` when catalog is empty — do not omit (omitting falls back to legacy static tiles for Deep/Move). */
  addonTilesFromPricing?: { id: string; label: string; price: number; icon: React.ReactNode }[];
  /** Set when Quick Clean rules are violated (hours, heavy add-ons, etc.). */
  pricingModeError?: string;
}

export function BookingStep2Schedule({
  data,
  setData,
  onBack,
  onContinue,
  pricing,
  serviceTitle,
  addonTilesFromPricing,
  pricingModeError,
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

  const totalEstimate = pricing.total;
  const canContinue = selectedDate !== null && selectedTime !== null;

  const selectedDateStr = selectedDate ? toDateStr(selectedDate) : null;

  const useUnifiedAvailabilityFlow = data.service === 'standard' || data.service === 'airbnb';

  const unifiedAvailabilityBody = useMemo((): UnifiedAvailabilityBody | null => {
    if (!useUnifiedAvailabilityFlow || !selectedDateStr) return null;
    return {
      date: selectedDateStr,
      suburb: data.workingArea?.trim() || '',
      city: BOOKING_DEFAULT_CITY,
      service_type: data.service === 'airbnb' ? 'airbnb' : 'standard',
      pricing_mode: data.pricingMode === 'basic' ? 'quick' : 'premium',
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      extra_rooms: data.extraRooms,
      extras: data.extras,
      extrasQuantities: data.extrasQuantities,
      has_extra_cleaner: wizardHasExtraCleaner(data.extras),
    };
  }, [
    useUnifiedAvailabilityFlow,
    selectedDateStr,
    data.workingArea,
    data.service,
    data.pricingMode,
    data.bedrooms,
    data.bathrooms,
    data.extraRooms,
    data.extras,
    data.extrasQuantities,
  ]);

  const unifiedAvail = useUnifiedAvailability(
    Boolean(unifiedAvailabilityBody),
    unifiedAvailabilityBody
  );

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

  const slotOcc = useBookingSlotOccupancy(
    useUnifiedAvailabilityFlow ? null : selectedDateStr,
    slotDispatchContext
  );
  const { variant: abVariant, track: trackAb } = useBookingAbVariant();
  const abLabelVariant = abVariant ?? 'A';

  const timeSlots = useMemo((): TimeSlotWithAvailability[] => {
    if (useUnifiedAvailabilityFlow) {
      if (unifiedAvail.status !== 'success') {
        return [];
      }
      const need = Math.max(1, unifiedAvail.teamSize ?? 1);
      return unifiedAvail.slots.map((s) => ({
        id: s.start,
        label: formatUnifiedSlotRangeLabel(s.start, s.end),
        booked: 0,
        capacity: Math.max(need, s.assignable_cleaners),
        available: s.available,
        remaining: s.available ? Math.max(0, s.assignable_cleaners - need) : 0,
        recommended: s.recommended,
      }));
    }
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
  }, [
    useUnifiedAvailabilityFlow,
    unifiedAvail.status,
    unifiedAvail.slots,
    unifiedAvail.teamSize,
    slotOcc.status,
    slotOcc.counts,
    slotOcc.remaining,
    slotOcc.eligibleCleaners,
  ]);

  const firstAvailableSlotId = useMemo(() => {
    if (useUnifiedAvailabilityFlow) {
      if (unifiedAvail.status !== 'success') return null;
      const rec = unifiedAvail.slots.find((s) => s.recommended && s.available);
      if (rec) return rec.start;
      const first = unifiedAvail.slots.find((s) => s.available);
      return first?.start ?? null;
    }
    if (slotOcc.status !== 'success') return null;
    for (const def of BOOKING_TIME_SLOT_DEFS) {
      if ((slotOcc.remaining[def.id] ?? 0) > 0) return def.id;
    }
    return null;
  }, [useUnifiedAvailabilityFlow, unifiedAvail.status, unifiedAvail.slots, slotOcc.status, slotOcc.remaining]);

  const unifiedHasNoBookableSlot = useMemo(() => {
    if (!useUnifiedAvailabilityFlow || unifiedAvail.status !== 'success') return false;
    if (unifiedAvail.slots.length === 0) return true;
    return !unifiedAvail.slots.some((s) => s.available);
  }, [useUnifiedAvailabilityFlow, unifiedAvail.status, unifiedAvail.slots]);

  const slotUrgencyBanner = useMemo(() => {
    if (!selectedDate || timeSlots.length === 0) return null;
    const avail = timeSlots.filter((s) => s.available);
    if (avail.length === 0) return null;
    const almostGone = avail.filter((s) => s.remaining <= 1).length;
    const tight = avail.filter((s) => s.available && s.remaining <= 3).length;
    if (almostGone >= 1) return 'few' as const;
    if (tight >= 2) return 'fast' as const;
    return null;
  }, [selectedDate, timeSlots]);

  const flatSortedSlots = useMemo(() => {
    if (timeSlots.length === 0) return [];
    return [...timeSlots].sort((a, b) => parseSlotStartToMinutes(a.id) - parseSlotStartToMinutes(b.id));
  }, [timeSlots]);

  const selectedTimeDisplayLabel = useMemo(() => {
    if (!selectedTime) return null;
    if (useUnifiedAvailabilityFlow && unifiedAvail.status === 'success') {
      const sl = timeSlots.find((s) => s.id === selectedTime);
      return sl?.label ?? selectedTime;
    }
    return labelForBookingSlotId(selectedTime);
  }, [selectedTime, useUnifiedAvailabilityFlow, unifiedAvail.status, timeSlots]);

  const mobileSlotItems = useMemo(
    () =>
      flatSortedSlots.map((slot) => {
        const occupancyReady = useUnifiedAvailabilityFlow ? unifiedAvail.status === 'success' : slotOcc.status === 'success';
        const demandPopular =
          occupancyReady && slot.available && !slot.recommended && slot.remaining <= 3 && slot.remaining > 1;
        const demandFew = occupancyReady && slot.available && slot.remaining === 1;
        let caption = '';
        if (!slot.available) caption = 'Unavailable';
        else if (demandFew) caption = 'Few left';
        else if (demandPopular) caption = 'Popular';
        else caption = getAvailabilityUrgencyLabel(slot.remaining, abLabelVariant);

        return {
          id: slot.id,
          label: formatSlotCompactTime(slot.id),
          caption,
          disabled: !slot.available,
          recommended: Boolean(slot.recommended),
        };
      }),
    [
      flatSortedSlots,
      useUnifiedAvailabilityFlow,
      unifiedAvail.status,
      slotOcc.status,
      abLabelVariant,
    ]
  );

  useEffect(() => {
    if (useUnifiedAvailabilityFlow) {
      if (unifiedAvail.status !== 'success' || selectedTime != null || !firstAvailableSlotId) return;
      setSelectedTime(firstAvailableSlotId);
      return;
    }
    if (slotOcc.status !== 'success' || selectedTime != null || !firstAvailableSlotId) return;
    setSelectedTime(firstAvailableSlotId);
  }, [
    useUnifiedAvailabilityFlow,
    unifiedAvail.status,
    slotOcc.status,
    selectedTime,
    firstAvailableSlotId,
  ]);

  useEffect(() => {
    if (selectedTime) trackAb('slot_selected');
  }, [selectedTime, trackAb]);

  useEffect(() => {
    if (useUnifiedAvailabilityFlow) {
      if (unifiedAvail.status !== 'success' || !selectedTime) return;
      const row = unifiedAvail.slots.find((s) => s.start === selectedTime);
      if (!row || !row.available) {
        setSelectedTime(null);
        setData((prev) => ({ ...prev, time: '' }));
      }
      return;
    }
    if (slotOcc.status !== 'success' || !selectedTime) return;
    const rem = slotOcc.remaining[selectedTime] ?? 0;
    if (rem <= 0) {
      setSelectedTime(null);
      setData((prev) => ({ ...prev, time: '' }));
    }
  }, [
    useUnifiedAvailabilityFlow,
    unifiedAvail.status,
    unifiedAvail.slots,
    slotOcc.status,
    slotOcc.remaining,
    selectedTime,
    setData,
  ]);

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

  /** Earliest day in the visible strip when nothing selected yet */
  useEffect(() => {
    if (selectedDate != null) return;
    if (selectableDates.length === 0) return;
    const first = selectableDates.find((d) => isAllowedBookingDate(d));
    if (first) setSelectedDate(first);
  }, [selectedDate, selectableDates]);

  /** Keep selection aligned when changing week */
  useEffect(() => {
    if (!selectedDate || selectableDates.length === 0) return;
    const visible = selectableDates.some((d) => isSameDay(d, selectedDate));
    if (!visible) {
      setSelectedDate(selectableDates[0] ?? null);
      setSelectedTime(null);
    }
  }, [weekStartOffset, selectableDates, selectedDate]);

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
    if (
      qtyServices &&
      isQuantityAddonTile(extra.id) &&
      !NO_QUANTITY_MODAL_EXTRA_IDS.has(extra.id)
    ) {
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

  const handleTryAnotherDay = () => {
    if (!selectedDate) {
      if (canGoDateNext) goDateNext();
      return;
    }
    const idx = selectableDates.findIndex((d) => isSameDay(d, selectedDate));
    if (idx >= 0 && idx < selectableDates.length - 1) {
      handleDateSelect(selectableDates[idx + 1]!);
      return;
    }
    if (canGoDateNext) goDateNext();
  };

  const handleGoToNextAvailableDay = () => {
    if (!unifiedAvail.nextAvailableDay) {
      handleTryAnotherDay();
      return;
    }
    const d = parseDateStr(unifiedAvail.nextAvailableDay);
    if (!d || !isAllowedBookingDate(d)) {
      handleTryAnotherDay();
      return;
    }
    setWeekStartOffset(offsetForDateToBeVisible(d));
    handleDateSelect(d);
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
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Shalean Cleaning Services
            </p>
            <h1 className="text-lg font-bold text-foreground leading-tight">Choose a date &amp; time</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Takes ~1 min</p>
          </div>
        </div>

        <BookingFlowStepIndicator activeStep={2} stepHint="Takes ~1 min" />
      </div>

      <BookingFlowLayout
        className={cn(selectedTime ? 'pb-28 lg:pb-8' : 'pb-8 lg:pb-8')}
        sidebar={
          <motion.div
            key={`${selectedDate ? toDateStr(selectedDate) : 'none'}-${selectedTime ?? ''}-${totalEstimate}`}
            initial={{ opacity: 0.88, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full"
          >
          <BookingSummary
            mode="preview"
            step={2}
            serviceTitle={serviceTitle}
            propertySummary={`${data.bedrooms} bed · ${data.bathrooms} bath${data.workingArea ? ` · ${data.workingArea}` : ''}`}
            bookingDetails={{
              where:
                [data.address?.trim(), data.workingArea?.trim()].filter(Boolean).join(' · ') ||
                data.workingArea?.trim() ||
                'Add your area',
              what: serviceTitle,
              when:
                selectedDate && selectedTime
                  ? `${formatSelectedDateLong(selectedDate)} · ${selectedTimeDisplayLabel ?? labelForBookingSlotId(selectedTime)}`
                  : 'Choose date & time',
            }}
            onFindCleaner={handleContinue}
            findCleanerCtaDisabled={!canContinue}
            primaryCtaLabel="Continue to details →"
            totalZar={totalEstimate}
            pricingContext={
              pricing.engineMeta
                ? {
                    estimatedJobHours:
                      pricing.engineMeta.estimatedHours ?? pricing.engineMeta.estimatedJobHours,
                    teamSize: pricing.engineMeta.teamSize,
                  }
                : null
            }
          />
          </motion.div>
        }
        >
        <StepLayout
          step={2}
          totalSteps={4}
          title="Choose date and time"
          subtitle="Select the best slot, then continue"
        >
          {pricingModeError && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {pricingModeError}
            </div>
          )}

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

          <div
            id="booking-schedule-anchor"
            className="rounded-2xl border border-border/70 bg-card shadow-md shadow-black/[0.06] p-4 sm:p-5 space-y-5 scroll-mt-24"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Calendar size={18} aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground leading-tight">Pick your slot</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Next 7 days · swipe on mobile</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 overflow-hidden bg-muted/15">
              <div className="flex items-center justify-between gap-2 px-2 sm:px-3 py-2.5 border-b border-border/60 bg-muted/25">
                <button
                  type="button"
                  onClick={goDatePrev}
                  disabled={!canGoDatePrev}
                  aria-label="Previous dates"
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} className="text-foreground" />
                </button>
                <p className="min-w-0 text-center text-xs font-semibold text-muted-foreground truncate px-1">
                  {formatWeekRangeLabel(selectableDates)}
                </p>
                <button
                  type="button"
                  onClick={goDateNext}
                  disabled={!canGoDateNext}
                  aria-label="Next dates"
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} className="text-foreground" />
                </button>
              </div>

              <div className="p-2 sm:p-3">
                <div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-1 scrollbar-thin">
                  {selectableDates.map((cellDate) => {
                    const demandBadge = getDateDemandBadge(cellDate);
                    const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;
                    const todayCell = isToday(cellDate);
                    return (
                      <motion.button
                        key={toDateStr(cellDate)}
                        type="button"
                        onClick={() => handleDateSelect(cellDate)}
                        whileTap={{ scale: 0.96 }}
                        className={cn(
                          'relative flex min-w-[4.75rem] sm:min-w-0 flex-col items-center justify-center rounded-xl py-2.5 px-1.5 snap-center transition-all duration-150',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                            : todayCell
                              ? 'ring-2 ring-primary/40 bg-background text-foreground'
                              : 'border border-border/80 bg-background text-foreground hover:border-primary/40 hover:bg-primary/5'
                        )}
                      >
                        {demandBadge ? (
                          <span
                            className={cn(
                              'absolute -top-1 left-1/2 -translate-x-1/2 max-w-[5.5rem] truncate rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide',
                              demandBadge.variant === 'amber' && 'bg-amber-100 text-amber-900',
                              demandBadge.variant === 'violet' && 'bg-violet-100 text-violet-900',
                              demandBadge.variant === 'emerald' && 'bg-emerald-100 text-emerald-900',
                              isSelected && 'bg-primary-foreground/20 text-primary-foreground'
                            )}
                          >
                            {demandBadge.label}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            'text-[11px] font-semibold',
                            isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                          )}
                        >
                          {formatCompactWeekday(cellDate)}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold tabular-nums leading-tight mt-0.5',
                            demandBadge ? 'mt-2' : ''
                          )}
                        >
                          {formatCompactDayMonth(cellDate)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-muted-foreground shrink-0" aria-hidden />
                <span className="text-sm font-semibold text-foreground">Start time</span>
                {selectedTime && selectedDate ? (
                  <span className="ml-auto truncate text-xs font-medium text-primary">
                    {selectedTimeDisplayLabel ?? labelForBookingSlotId(selectedTime)}
                  </span>
                ) : null}
              </div>

              {useUnifiedAvailabilityFlow && (
                <p className="text-[11px] text-muted-foreground">
                  Price may vary slightly by time (demand-based).
                </p>
              )}

              <AnimatePresence mode="wait">
                {!selectedDate ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-xl border border-dashed border-border py-8 flex flex-col items-center gap-2 text-center px-3"
                  >
                    <Calendar size={26} className="text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground font-medium">Choose a day to see times</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="slots"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-3"
                  >
                    {(useUnifiedAvailabilityFlow
                      ? unifiedAvail.status === 'error' && unifiedAvail.errorMessage
                      : slotOcc.status === 'error' && slotOcc.errorMessage) && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2">
                        {useUnifiedAvailabilityFlow ? unifiedAvail.errorMessage : slotOcc.errorMessage}
                      </p>
                    )}
                    {useUnifiedAvailabilityFlow &&
                      (unifiedAvail.status === 'loading' || unifiedAvail.status === 'idle') && (
                        <p className="text-xs text-muted-foreground text-center py-6">Loading times…</p>
                      )}
                    {useUnifiedAvailabilityFlow &&
                      unifiedAvail.status === 'success' &&
                      unifiedAvail.durationMinutes != null && (
                        <p className="text-xs font-medium text-foreground">
                          Est. duration {formatDurationMinutesLabel(unifiedAvail.durationMinutes)}
                        </p>
                      )}
                    {useUnifiedAvailabilityFlow &&
                      unifiedAvail.status === 'success' &&
                      unifiedAvail.latestStart &&
                      !unifiedHasNoBookableSlot && (
                        <p className="text-xs font-semibold text-violet-800 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                          To fit this job today, start by {unifiedAvail.latestStart}.
                        </p>
                      )}

                    {slotUrgencyBanner === 'few' ? (
                      <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        Only a few times left
                      </p>
                    ) : slotUrgencyBanner === 'fast' ? (
                      <p className="text-xs font-semibold text-orange-800 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                        Slots are filling fast today
                      </p>
                    ) : null}

                    {useUnifiedAvailabilityFlow && unifiedAvail.status === 'success' && unifiedHasNoBookableSlot && (
                      <div
                        className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center space-y-4"
                        role="status"
                      >
                        <p className="text-sm font-semibold text-foreground">No times available for this day</p>
                        {unifiedAvail.requiredDurationMinutes != null ? (
                          <p className="text-xs text-muted-foreground">
                            This job requires {formatDurationMinutesLabel(unifiedAvail.requiredDurationMinutes)}.
                          </p>
                        ) : null}
                        {unifiedAvail.suggestion ? (
                          <p className="text-xs text-muted-foreground">{unifiedAvail.suggestion}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Try an earlier start time or choose another day.
                          </p>
                        )}
                        {unifiedAvail.latestStart ? (
                          <p className="text-xs text-muted-foreground">
                            Latest possible start for this day is {unifiedAvail.latestStart}.
                          </p>
                        ) : null}
                        {unifiedAvail.nextAvailableDay ? (
                          <button
                            type="button"
                            onClick={handleGoToNextAvailableDay}
                            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                          >
                            Next available: {formatYmdFriendly(unifiedAvail.nextAvailableDay)}{' '}
                            <ArrowRight size={14} aria-hidden />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleTryAnotherDay}
                          className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                        >
                          Try another day <ArrowRight size={14} aria-hidden />
                        </button>
                      </div>
                    )}

                    {!useUnifiedAvailabilityFlow || !unifiedHasNoBookableSlot ? (
                      <TimeSlotPicker
                        slots={mobileSlotItems}
                        selectedSlotId={selectedTime}
                        onSelect={(id) => setSelectedTime(id)}
                      />
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </StepLayout>
      </BookingFlowLayout>

      <StickyCTA
        title={selectedTimeDisplayLabel ?? 'Pick your preferred time'}
        subtitle={selectedDate ? formatSelectedDateLong(selectedDate) : 'Choose a day'}
        totalLabel={`R${totalEstimate.toLocaleString('en-ZA')}`}
        buttonLabel="Continue to cleaner"
        onClick={handleContinue}
        disabled={!canContinue}
        urgencyText={
          slotUrgencyBanner === 'few'
            ? 'Only a few slots left'
            : slotUrgencyBanner === 'fast'
              ? 'Slots are filling fast'
              : undefined
        }
        helperText="Trusted by 100+ homes in Cape Town"
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
