'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Star,
  Clock,
  MapPin,
  Check,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProfile } from '@/components/dashboard/customer-portal/hooks';
import { useBookingForm } from './hooks';
import type { BookingStep, FlowCleaner, FlowExtra } from './types';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import type { ServiceType } from '@/types/booking';
import { useDashboardBooking, bookingServiceInfo } from '@/shared/booking';
import { aggregateExtraQuantitiesByName, slugifyExtraId } from '@/lib/booking-pricing-input';
import type { BookingFormData } from '@/lib/useBookingFormData';
import { useBookingSlotOccupancy } from '@/lib/use-booking-slot-occupancy';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import {
  getAvailabilityStyle,
  getAvailabilityUrgencyLabel,
} from '@/lib/booking-slot-availability-styles';
import { useBookingAbVariant } from '@/hooks/use-booking-ab-variant';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';

const STEPS: BookingStep[] = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Date & Time' },
  { id: 3, label: 'Cleaner' },
  { id: 4, label: 'Extras' },
  { id: 5, label: 'Payment' },
];

const TEAM_ID_TO_NAME: Record<string, 'Team A' | 'Team B' | 'Team C'> = {
  t1: 'Team A',
  t2: 'Team B',
  t3: 'Team C',
};

const TEAM_OPTIONS: FlowCleaner[] = [
  {
    id: 't1',
    name: 'Team A',
    initial: 'A',
    specialty: 'Deep clean & move crews',
    rating: '5.0',
    reviews: 'Team',
  },
  {
    id: 't2',
    name: 'Team B',
    initial: 'B',
    specialty: 'Deep clean & move crews',
    rating: '5.0',
    reviews: 'Team',
  },
  {
    id: 't3',
    name: 'Team C',
    initial: 'C',
    specialty: 'Deep clean & move crews',
    rating: '5.0',
    reviews: 'Team',
  },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useNextSevenDays() {
  return useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const start = new Date();
    const out: Array<{ id: string; iso: string; day: string; date: string; month: string }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      out.push({
        id: `date-${iso}`,
        iso,
        day: dayLabels[d.getDay()],
        date: String(d.getDate()),
        month: monthLabels[d.getMonth()],
      });
    }
    return out;
  }, []);
}

function buildExtrasList(formData: BookingFormData | null, service: string): FlowExtra[] {
  if (!formData?.extras) return [];
  const isStd = service === 'Standard' || service === 'Airbnb';
  const isDeep = service === 'Deep' || service === 'Move In/Out';
  if (service === 'Carpet') return [];

  const names: string[] = isStd
    ? [...formData.extras.standardAndAirbnb]
    : isDeep
      ? [...formData.extras.deepAndMove]
      : [];

  if (isStd) {
    names.push('Extra Cleaner');
  }

  return names.map((name) => {
    const id = name === 'Extra Cleaner' ? 'extra_cleaner' : slugifyExtraId(name);
    const p = formData.extras.prices[name] ?? 0;
    return {
      id,
      name,
      catalogName: name,
      price: `+R${Math.round(p)}`,
    };
  });
}

function formatZar(n: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export interface BookingFlowProps {
  onBack: () => void;
  addressLine?: string | null;
}

export function BookingFlow({ onBack, addressLine }: BookingFlowProps) {
  const { formData, services, timeSlotDefs, isInitialLoading, loadError } = useBookingForm();
  const {
    state,
    setState,
    setService,
    linePricing,
    total: preSurgeTotalZar,
    carpetDetails,
  } = useDashboardBooking({ formData });
  const { user, customerAddressParts } = useProfile();

  const slotDispatchContext = useMemo(
    () => ({
      suburb: customerAddressParts?.suburb?.trim() ?? '',
      city: customerAddressParts?.city?.trim() || BOOKING_DEFAULT_CITY,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      extras: state.selectedExtraIds,
      extrasQuantities: {},
    }),
    [
      customerAddressParts?.suburb,
      customerAddressParts?.city,
      state.bedrooms,
      state.bathrooms,
      state.selectedExtraIds,
    ]
  );

  const slotOcc = useBookingSlotOccupancy(state.date, slotDispatchContext);
  const { variant: abVariant, track: trackAb } = useBookingAbVariant();
  const timeSlots = useMemo(() => {
    return timeSlotDefs.map((def) => {
      if (slotOcc.status !== 'success') {
        return {
          id: def.id,
          time: def.time,
          available: false,
          remaining: 0,
        };
      }
      const remaining = slotOcc.remaining[def.id] ?? 0;
      return {
        id: def.id,
        time: def.time,
        available: remaining > 0,
        remaining,
      };
    });
  }, [timeSlotDefs, slotOcc.status, slotOcc.remaining]);

  const firstAvailableSlotId = useMemo(() => {
    if (slotOcc.status !== 'success') return null;
    for (const def of timeSlotDefs) {
      if ((slotOcc.remaining[def.id] ?? 0) > 0) return def.id;
    }
    return null;
  }, [slotOcc.status, slotOcc.remaining, timeSlotDefs]);

  useEffect(() => {
    if (slotOcc.status !== 'success' || !state.time) return;
    const rem = slotOcc.remaining[state.time] ?? 0;
    if (rem <= 0) {
      setState((s) => ({ ...s, time: '' }));
    }
  }, [slotOcc.status, slotOcc.remaining, state.time, setState]);

  const DATE_OPTIONS = useNextSevenDays();

  const [step, setStep] = useState(1);

  useEffect(() => {
    if (step !== 2) return;
    if (
      slotOcc.status !== 'success' ||
      (state.time && state.time.length > 0) ||
      !firstAvailableSlotId
    ) {
      return;
    }
    setState((s) => ({ ...s, time: firstAvailableSlotId }));
  }, [step, slotOcc.status, state.time, firstAvailableSlotId, setState]);

  useEffect(() => {
    if (step !== 2 || !state.time) return;
    trackAb('slot_selected');
  }, [step, state.time, trackAb]);

  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [apiCleaners, setApiCleaners] = useState<ApiCleaner[]>([]);
  const [cleanersLoading, setCleanersLoading] = useState(false);
  const [checkoutFinalZar, setCheckoutFinalZar] = useState<number | null>(null);

  const selectedService = state.service?.id ?? '';

  useEffect(() => {
    setState((s) => ({ ...s, date: s.date || DATE_OPTIONS[0]?.iso || '' }));
  }, [DATE_OPTIONS, setState]);

  const isTeamService =
    selectedService === 'Deep' || selectedService === 'Move In/Out';

  const extrasList = useMemo(
    () => buildExtrasList(formData, selectedService),
    [formData, selectedService]
  );

  const currentService = services.find((s) => s.id === selectedService);

  const fetchCheckoutPricingPreview = useCallback(async () => {
    if (!formData?.pricing || !selectedService || !state.date) {
      throw new Error('Missing booking details for pricing.');
    }
    const extrasQuantitiesById: Record<string, number> = {};
    state.selectedExtraIds.forEach((id) => {
      extrasQuantitiesById[id] = (extrasQuantitiesById[id] || 0) + 1;
    });
    const extrasQuantities = aggregateExtraQuantitiesByName(
      state.selectedExtraIds,
      extrasQuantitiesById,
      formData.extras.all
    );
    const previewRes = await fetch('/api/booking/pricing-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: state.date,
        service: selectedService,
        preSurgeTotal: preSurgeTotalZar,
        selected_team: isTeamService ? TEAM_ID_TO_NAME[state.cleaner_id ?? ''] : undefined,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        extraRooms: selectedService === 'Carpet' ? 0 : state.extraRooms,
        extras: state.selectedExtraIds,
        extrasQuantities,
        frequency: 'one-time',
        tipAmount: 0,
        discountAmount: 0,
        numberOfCleaners: 1,
        provideEquipment:
          (selectedService === 'Standard' || selectedService === 'Airbnb') && state.provideEquipment,
        carpetDetails: carpetDetails ?? undefined,
      }),
    });
    const preview = await previewRes.json();
    if (!previewRes.ok || !preview.ok) {
      throw new Error(preview.error || 'Could not confirm pricing for this date.');
    }
    return preview as { preSurgeTotalZar: number; finalTotalZar: number };
  }, [
    formData,
    selectedService,
    state.date,
    state.selectedExtraIds,
    state.bedrooms,
    state.bathrooms,
    state.extraRooms,
    state.provideEquipment,
    state.cleaner_id,
    preSurgeTotalZar,
    isTeamService,
    carpetDetails,
  ]);

  useEffect(() => {
    if (step !== 5 || preSurgeTotalZar <= 0 || !state.date || !state.time) {
      setCheckoutFinalZar(null);
      return;
    }
    let cancelled = false;
    fetchCheckoutPricingPreview()
      .then((p) => {
        if (!cancelled) setCheckoutFinalZar(p.finalTotalZar);
      })
      .catch(() => {
        if (!cancelled) setCheckoutFinalZar(null);
      });
    return () => {
      cancelled = true;
    };
  }, [step, preSurgeTotalZar, state.date, state.time, fetchCheckoutPricingPreview]);

  useEffect(() => {
    if (!state.date || !state.time || !customerAddressParts || isTeamService) {
      setApiCleaners([]);
      return;
    }
    let cancelled = false;
    setCleanersLoading(true);
    const params = new URLSearchParams({
      date: state.date,
      city: customerAddressParts.city?.trim() || BOOKING_DEFAULT_CITY,
      suburb: customerAddressParts.suburb,
      time: state.time,
    });
    params.set(
      'duration_minutes',
      String(
        computeBookingDurationMinutes({
          bedrooms: state.bedrooms,
          bathrooms: state.bathrooms,
          extras: state.selectedExtraIds,
          extrasQuantities: {},
        })
      )
    );
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
    state.date,
    state.time,
    state.bedrooms,
    state.bathrooms,
    state.selectedExtraIds,
    customerAddressParts,
    isTeamService,
  ]);

  const flowCleaners: FlowCleaner[] = useMemo(() => {
    if (isTeamService) return TEAM_OPTIONS;
    return apiCleaners.map((c) => ({
      id: c.id,
      name: c.name,
      initial: (c.name?.trim()?.[0] || 'C').toUpperCase(),
      specialty: Array.isArray(c.specialties) && c.specialties[0] ? c.specialties[0] : 'Cleaning',
      rating: c.rating != null ? String(Number(c.rating).toFixed(1)) : '—',
      reviews:
        c.completion_rate != null ? `${Math.round(c.completion_rate)}% reliable` : '—',
    }));
  }, [isTeamService, apiCleaners]);

  const currentCleaner = flowCleaners.find((c) => c.id === state.cleaner_id);

  const displayTotalZar = checkoutFinalZar ?? preSurgeTotalZar;

  const canProceed = () => {
    if (step === 1) return !!selectedService;
    if (step === 2) return !!state.date && !!state.time;
    if (step === 3) {
      if (!state.cleaner_id) return false;
      if (isTeamService) return Boolean(TEAM_ID_TO_NAME[state.cleaner_id]);
      return UUID_RE.test(state.cleaner_id);
    }
    if (step === 4) return true;
    if (step === 5) return true;
    return false;
  };

  const toggleExtra = (id: string) => {
    setState((s) => ({
      ...s,
      selectedExtraIds: s.selectedExtraIds.includes(id)
        ? s.selectedExtraIds.filter((e) => e !== id)
        : [...s.selectedExtraIds, id],
    }));
  };

  const buildPendingPayload = useCallback(
    (finalTotalZar: number, preSurge: number) => {
      const nameParts = user.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || '—';
      const addr = customerAddressParts;
      if (!addr) {
        throw new Error('Add your street address in Profile before paying.');
      }
      const extrasQuantitiesById: Record<string, number> = {};
      state.selectedExtraIds.forEach((id) => {
        extrasQuantitiesById[id] = (extrasQuantitiesById[id] || 0) + 1;
      });
      const requiresTeam = isTeamService;
      const cleanerUuid =
        !requiresTeam && UUID_RE.test(state.cleaner_id ?? '')
          ? state.cleaner_id ?? undefined
          : undefined;
      const selected_team = requiresTeam ? TEAM_ID_TO_NAME[state.cleaner_id ?? ''] : undefined;

      return {
        step: 4 as const,
        service: selectedService as ServiceType,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        extraRooms: selectedService === 'Carpet' ? 0 : state.extraRooms,
        numberOfCleaners: 1,
        extras: state.selectedExtraIds,
        extrasQuantities: extrasQuantitiesById,
        carpetDetails: carpetDetails ?? undefined,
        provideEquipment:
          (selectedService === 'Standard' || selectedService === 'Airbnb') && state.provideEquipment,
        notes: '',
        date: state.date,
        time: state.time,
        frequency: 'one-time' as const,
        firstName,
        lastName,
        email: user.email.trim(),
        phone: (user.phone || '').trim() || '0000000000',
        address: {
          line1: addr.line1,
          suburb: addr.suburb,
          city: addr.city,
        },
        cleaner_id: cleanerUuid,
        selected_team,
        requires_team: requiresTeam,
        totalAmount: finalTotalZar,
        preSurgeTotal: preSurge,
        serviceFee: linePricing?.serviceFee ?? 0,
        frequencyDiscount: linePricing?.frequencyDiscount ?? 0,
        tipAmount: 0,
        discountAmount: 0,
        equipment_required:
          (selectedService === 'Standard' || selectedService === 'Airbnb') && state.provideEquipment,
        equipment_fee:
          (selectedService === 'Standard' || selectedService === 'Airbnb') && state.provideEquipment
            ? formData?.equipment?.charge ?? 0
            : 0,
      };
    },
    [
      user,
      customerAddressParts,
      state,
      isTeamService,
      selectedService,
      carpetDetails,
      linePricing,
      formData,
    ]
  );

  const handleSubmit = async () => {
    setPaymentError(null);
    if (!customerAddressParts) {
      toast.error('Add your street address in Profile before paying.');
      return;
    }
    if (!formData?.pricing || !linePricing) {
      toast.error('Pricing is not loaded. Refresh and try again.');
      return;
    }
    setPaying(true);
    try {
      const preview = await fetchCheckoutPricingPreview();
      const pendingBody = buildPendingPayload(preview.finalTotalZar, preview.preSurgeTotalZar);
      const pendingRes = await fetch('/api/bookings/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingBody),
      });
      const pendingJson = (await pendingRes.json()) as {
        ok?: boolean;
        error?: string;
        existingBookingId?: string;
        bookingId?: string;
      };
      if (
        pendingRes.status === 409 &&
        typeof pendingJson.existingBookingId === 'string' &&
        pendingJson.existingBookingId
      ) {
        throw new Error(
          pendingJson.error ||
            'You already have an unpaid booking for this slot. Pay or cancel it, then try again.'
        );
      }
      if (!pendingRes.ok || !pendingJson.ok || !pendingJson.bookingId) {
        throw new Error(pendingJson.error || 'Could not create booking for payment.');
      }
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: pendingJson.bookingId }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData.authorization_url) {
        throw new Error(initData.error || 'Could not start payment.');
      }
      window.location.href = initData.authorization_url as string;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  const displayAddress =
    addressLine?.trim() ||
    [customerAddressParts?.line1, customerAddressParts?.suburb, customerAddressParts?.city]
      .filter(Boolean)
      .join(', ') ||
    'Add your address in Profile';

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" aria-hidden />
        <span className="sr-only">Loading booking options</span>
      </div>
    );
  }

  if (loadError || !formData?.pricing || services.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-extrabold text-gray-900 mb-2">Could not load booking options</h2>
          <p className="text-sm text-gray-500 mb-6">
            {loadError || 'Pricing data is unavailable. Check your connection and try again.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full mt-3 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedDateLabel = DATE_OPTIONS.find((d) => d.iso === state.date);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4">
        <div className="w-full">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all',
                    step > s.id
                      ? 'bg-blue-600 text-white'
                      : step === s.id
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}
                </div>
                <span
                  className={cn(
                    'text-xs font-semibold transition-colors',
                    step === s.id
                      ? 'text-blue-600'
                      : step > s.id
                        ? 'text-gray-400'
                        : 'text-gray-300'
                  )}
                >
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-200 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-7 pb-32 lg:pb-16 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
        <div>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Choose a service</h2>
                <p className="text-sm text-gray-400 mb-5">Select the type of clean that fits your needs</p>
                <div className="space-y-3">
                  {services.map((svc) => (
                    <motion.button
                      key={svc.id}
                      type="button"
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        if (!formData) return;
                        setService(bookingServiceInfo(formData, svc.id, svc.name));
                      }}
                      className={cn(
                        'w-full text-left bg-white border-2 rounded-2xl p-4 transition-all',
                        selectedService === svc.id
                          ? 'border-blue-500 shadow-md shadow-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{svc.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{svc.duration}</span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-extrabold text-blue-600">{svc.price}</p>
                          {selectedService === svc.id && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center ml-auto mt-1">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Pick a date &amp; time</h2>
                <p className="text-sm text-gray-400 mb-5">
                  Select when you&apos;d like your cleaner to arrive
                </p>

                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Date</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
                  {DATE_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, date: d.iso }))}
                      className={cn(
                        'flex-shrink-0 flex flex-col items-center w-14 py-3 rounded-2xl border-2 transition-all',
                        state.date === d.iso
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-semibold',
                          state.date === d.iso ? 'text-blue-200' : 'text-gray-400'
                        )}
                      >
                        {d.day}
                      </span>
                      <span className="text-lg font-extrabold leading-tight">{d.date}</span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold',
                          state.date === d.iso ? 'text-blue-200' : 'text-gray-400'
                        )}
                      >
                        {d.month}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Time</p>
                {slotOcc.status === 'error' && slotOcc.errorMessage ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
                    {slotOcc.errorMessage}
                  </p>
                ) : null}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const showFullStyle = slotOcc.status === 'success' && !slot.available;
                    const occupancyReady = slotOcc.status === 'success';
                    const subline =
                      slotOcc.status === 'loading'
                        ? 'Loading…'
                        : slotOcc.status === 'error'
                          ? '—'
                          : getAvailabilityUrgencyLabel(slot.remaining, abVariant ?? 'A');
                    const highlightLast =
                      occupancyReady && slot.available && slot.remaining === 1;
                    const isRecommended =
                      occupancyReady && slot.available && firstAvailableSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => slot.available && setState((s) => ({ ...s, time: slot.id }))}
                        className={cn(
                          'py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center min-h-[3.25rem]',
                          slot.available && occupancyReady && 'hover:scale-105 transition-all duration-200 ease-out',
                          highlightLast && 'ring-2 ring-red-400',
                          showFullStyle
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through'
                            : !slot.available
                              ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-80'
                              : state.time === slot.id
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        )}
                      >
                        {isRecommended && (
                          <span
                            className={cn(
                              'text-[8px] font-bold uppercase tracking-wide mb-0.5 leading-tight',
                              state.time === slot.id && slot.available
                                ? 'text-blue-100'
                                : 'text-blue-600'
                            )}
                          >
                            Recommended
                          </span>
                        )}
                        <span>{slot.time}</span>
                        <span className="block mt-0.5 no-underline max-w-full">
                          {occupancyReady ? (
                            <span
                              className={cn(
                                'text-[10px] leading-tight px-2 py-1 rounded font-normal inline-block max-w-full text-center',
                                getAvailabilityStyle(slot.remaining)
                              )}
                            >
                              {subline}
                            </span>
                          ) : (
                            <span className="block text-[9px] font-normal text-gray-400">{subline}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                  {isTeamService ? 'Choose your team' : 'Choose your cleaner'}
                </h2>
                <p className="text-sm text-gray-400 mb-5">
                  {isTeamService
                    ? 'Deep and move bookings use a coordinated crew'
                    : 'Available cleaners for your area and time slot'}
                </p>
                {cleanersLoading && !isTeamService ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading cleaners…
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flowCleaners.length === 0 && !isTeamService ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4">
                        No cleaners available for this slot. Try another date or time.
                      </p>
                    ) : (
                      flowCleaners.map((cleaner) => (
                        <motion.button
                          key={cleaner.id}
                          type="button"
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setState((s) => ({ ...s, cleaner_id: cleaner.id }))}
                          className={cn(
                            'w-full text-left bg-white border-2 rounded-2xl p-4 transition-all',
                            state.cleaner_id === cleaner.id
                              ? 'border-blue-500 shadow-md shadow-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                              {cleaner.initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">{cleaner.name}</p>
                              <p className="text-xs text-gray-400">{cleaner.specialty}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span className="text-xs font-bold text-gray-700">{cleaner.rating}</span>
                                <span className="text-xs text-gray-400">({cleaner.reviews})</span>
                              </div>
                            </div>
                            {state.cleaner_id === cleaner.id && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Add extras</h2>
                <p className="text-sm text-gray-400 mb-5">Optional add-ons — same catalog as the main booking site</p>
                {extrasList.length === 0 ? (
                  <p className="text-sm text-gray-500">No optional extras for this service type.</p>
                ) : (
                  <div className="space-y-3">
                    {extrasList.map((extra) => (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleExtra(extra.id)}
                        className={cn(
                          'w-full flex items-center justify-between bg-white border-2 rounded-2xl px-4 py-3.5 transition-all',
                        state.selectedExtraIds.includes(extra.id)
                          ? 'border-blue-500 shadow-md shadow-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className="text-sm font-bold text-gray-900">{extra.name}</p>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-extrabold text-blue-600">{extra.price}</span>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                            state.selectedExtraIds.includes(extra.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          )}
                        >
                          {state.selectedExtraIds.includes(extra.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {(selectedService === 'Standard' || selectedService === 'Airbnb') &&
                  formData.equipment && (
                    <label className="mt-4 flex items-start gap-3 cursor-pointer bg-white border-2 rounded-2xl px-4 py-3.5 border-gray-200">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300"
                        checked={state.provideEquipment}
                        onChange={(e) =>
                          setState((s) => ({ ...s, provideEquipment: e.target.checked }))
                        }
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Bring cleaning supplies kit</p>
                        <p className="text-xs text-gray-500">
                          +{formatZar(formData.equipment.charge)} — same as main booking flow
                        </p>
                      </div>
                    </label>
                  )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Payment</h2>
                <p className="text-sm text-gray-400 mb-5">
                  You&apos;ll complete payment securely on Paystack — same checkout as the main site.
                </p>
                {paymentError && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    We use Paystack for card and mobile payments. When you continue, you&apos;ll be
                    redirected to complete payment. Your booking stays pending until payment succeeds.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-700">Address</p>
                    <p className="text-xs text-blue-500 mt-0.5">{displayAddress}</p>
                  </div>
                </div>
                {!customerAddressParts && (
                  <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    Add a full street address in Profile before paying — we need it for the booking.
                  </p>
                )}
                <div className="lg:hidden mt-6 border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total due</p>
                  <p className="text-2xl font-extrabold text-blue-600">
                    {linePricing ? formatZar(displayTotalZar) : '—'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!canProceed() || paying || (step === 5 && !customerAddressParts)}
              onClick={() => {
                if (step === 2 && state.time) trackAb('continue_step2');
                if (step < 5) setStep((s) => s + 1);
                else handleSubmit();
              }}
              className={cn(
                'flex-1 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                canProceed() && !paying && (step < 5 || customerAddressParts)
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
            >
              {paying && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{paying ? 'Redirecting…' : step === 5 ? 'Pay with Paystack' : 'Continue'}</span>
              {step < 5 && !paying && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sticky top-28">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Booking Summary</p>

            <div className="space-y-3 mb-4 text-xs">
              <p className="font-bold text-gray-500 uppercase tracking-wider">Home size</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">
                  {selectedService === 'Carpet' ? 'Fitted carpet rooms' : 'Bedrooms'}
                </span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={state.bedrooms}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      bedrooms: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-right font-bold text-gray-900"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">
                  {selectedService === 'Carpet' ? 'Loose rugs' : 'Bathrooms'}
                </span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={state.bathrooms}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      bathrooms: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-right font-bold text-gray-900"
                />
              </div>
              {selectedService && selectedService !== 'Carpet' && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Extra rooms</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={state.extraRooms}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        extraRooms: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-right font-bold text-gray-900"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Service</p>
                <p className="text-xs font-bold text-gray-900 text-right">
                  {currentService ? (
                    currentService.name
                  ) : (
                    <span className="text-gray-300">Not selected</span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{isTeamService ? 'Team' : 'Cleaner'}</p>
                <p className="text-xs font-bold text-gray-900 text-right">
                  {currentCleaner ? (
                    currentCleaner.name
                  ) : (
                    <span className="text-gray-300">Not selected</span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-xs font-bold text-gray-900 text-right">
                  {selectedDateLabel ? (
                    <span>
                      {selectedDateLabel.day}, {selectedDateLabel.date} {selectedDateLabel.month}
                    </span>
                  ) : (
                    <span className="text-gray-300">Not selected</span>
                  )}
                </p>
              </div>
            </div>

            {linePricing && (
              <div className="border-t border-gray-100 pt-3 mb-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatZar(linePricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Service fee</span>
                  <span className="font-semibold text-gray-800">{formatZar(linePricing.serviceFee)}</span>
                </div>
                {linePricing.frequencyDiscount > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Frequency discount</span>
                    <span className="font-semibold text-gray-800">
                      −{formatZar(linePricing.frequencyDiscount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {state.selectedExtraIds.length > 0 && (
              <div className="border-t border-gray-100 pt-3 mb-3 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Extras</p>
                {extrasList
                  .filter((e) => state.selectedExtraIds.includes(e.id))
                  .map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{e.name}</p>
                      <p className="text-xs font-bold text-gray-700">{e.price}</p>
                    </div>
                  ))}
                {state.provideEquipment && (selectedService === 'Standard' || selectedService === 'Airbnb') && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Supplies kit</p>
                    <p className="text-xs font-bold text-gray-700">
                      +{formatZar(formData.equipment?.charge ?? 0)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {state.provideEquipment &&
              state.selectedExtraIds.length === 0 &&
              (selectedService === 'Standard' || selectedService === 'Airbnb') && (
                <div className="border-t border-gray-100 pt-3 mb-3 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Extras</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Supplies kit</p>
                    <p className="text-xs font-bold text-gray-700">
                      +{formatZar(formData.equipment?.charge ?? 0)}
                    </p>
                  </div>
                </div>
              )}

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-gray-900">Total</p>
                <p className="text-lg font-extrabold text-blue-600 text-right">
                  {linePricing ? (
                    formatZar(displayTotalZar)
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </p>
              </div>
              {step === 5 && checkoutFinalZar == null && linePricing && (
                <p className="text-[10px] text-gray-400 mt-1">Confirming surge pricing for your date…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
