'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/components/dashboard/customer-portal/hooks';
import { useBookingForm } from './hooks';
import { BookingFlowView } from './booking-flow-view';
import type { BookingStep, FlowExtra, FlowCleaner } from './types';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import type { ServiceType } from '@/types/booking';
import { useDashboardBooking, bookingServiceInfo } from '@/shared/booking';
import { aggregateExtraQuantitiesByName, slugifyExtraId } from '@/lib/booking-pricing-input';
import type { BookingFormData } from '@/lib/useBookingFormData';
import { useBookingSlotOccupancy } from '@/lib/use-booking-slot-occupancy';
import { useBookingAbVariant } from '@/hooks/use-booking-ab-variant';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import {
  MAX_BOOKING_DAYS_FROM_TODAY,
  toDateStr,
  parseDateStr,
  isAllowedBookingDate,
  offsetForDateToBeVisible,
  getSevenDaysStartingOffset,
} from '@/shared/booking-engine/booking-dates';
import { BOOKING_TEAM_NAMES, isBookingTeamName } from '@/shared/booking-engine';
import { aggregateExtraIdsToQuantities } from '@/shared/booking-engine/dashboard-pricing-bridge';
import {
  getOptimalTeamSize,
  getBookingDurationMinutes,
  getAvailableSlots,
  buildDashboardPendingBookingPayload,
} from '@/shared/booking-engine';
import { validatePhoneNumber } from '@/lib/phone-validation';
import { supportWhatsAppHref } from '@/components/dashboard/customer-portal/booking-contact';

const STEPS: BookingStep[] = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Date & Time' },
  { id: 3, label: 'Cleaner' },
  { id: 4, label: 'Extras' },
  { id: 5, label: 'Payment' },
];

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

  const extrasQuantitiesById = useMemo(
    () => aggregateExtraIdsToQuantities(state.selectedExtraIds),
    [state.selectedExtraIds]
  );

  const slotDispatchContext = useMemo(
    () => ({
      suburb: customerAddressParts?.suburb?.trim() ?? '',
      city: customerAddressParts?.city?.trim() || BOOKING_DEFAULT_CITY,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      extras: state.selectedExtraIds,
      extrasQuantities: extrasQuantitiesById,
    }),
    [
      customerAddressParts?.suburb,
      customerAddressParts?.city,
      state.bedrooms,
      state.bathrooms,
      state.selectedExtraIds,
      extrasQuantitiesById,
    ]
  );

  const slotOcc = useBookingSlotOccupancy(state.date, slotDispatchContext);
  const { variant: abVariant, track: trackAb } = useBookingAbVariant();
  const timeSlots = useMemo(
    () =>
      getAvailableSlots({
        slotDefs: timeSlotDefs,
        remainingBySlotId: slotOcc.status === 'success' ? slotOcc.remaining : null,
        occupancyStatus: slotOcc.status,
      }),
    [timeSlotDefs, slotOcc.status, slotOcc.remaining]
  );

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

  const [weekStartOffset, setWeekStartOffset] = useState(0);
  const selectableDates = useMemo(
    () => getSevenDaysStartingOffset(weekStartOffset),
    [weekStartOffset]
  );
  const canGoDatePrev = weekStartOffset > 0;
  const canGoDateNext = weekStartOffset + 13 <= MAX_BOOKING_DAYS_FROM_TODAY;

  const goDatePrev = () => {
    if (!canGoDatePrev) return;
    setWeekStartOffset((o) => Math.max(0, o - 7));
  };
  const goDateNext = () => {
    if (!canGoDateNext) return;
    setWeekStartOffset((o) => o + 7);
  };

  const [step, setStep] = useState(1);

  useEffect(() => {
    setState((s) => {
      if (s.date) return s;
      return { ...s, date: toDateStr(getSevenDaysStartingOffset(0)[0]) };
    });
  }, [setState]);

  useEffect(() => {
    const parsed = parseDateStr(state.date);
    if (parsed && isAllowedBookingDate(parsed)) {
      setWeekStartOffset(offsetForDateToBeVisible(parsed));
    }
  }, [state.date]);

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
  const [bookedTeams, setBookedTeams] = useState<string[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [checkoutFinalZar, setCheckoutFinalZar] = useState<number | null>(null);

  const selectedService = state.service?.id ?? '';

  const isTeamService =
    selectedService === 'Deep' || selectedService === 'Move In/Out';

  const numberOfCleanersForPricing = useMemo(() => {
    if (!selectedService) return 1;
    return getOptimalTeamSize({
      kind: 'dashboard',
      service: selectedService as ServiceType,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      extraRooms: selectedService === 'Carpet' ? 0 : state.extraRooms,
      selectedExtraIds: state.selectedExtraIds,
      extrasQuantitiesById,
    });
  }, [
    selectedService,
    state.bedrooms,
    state.bathrooms,
    state.extraRooms,
    state.selectedExtraIds,
    extrasQuantitiesById,
  ]);

  useEffect(() => {
    if (!state.date) return;
    const inWeek = selectableDates.some((d) => toDateStr(d) === state.date);
    if (!inWeek) {
      setState((s) => ({ ...s, date: '', time: '' }));
    }
  }, [selectableDates, state.date, setState]);

  useEffect(() => {
    if (!isTeamService || !state.date || !selectedService) {
      setBookedTeams([]);
      return;
    }
    let cancelled = false;
    setTeamsLoading(true);
    const q = new URLSearchParams({ date: state.date, service: selectedService });
    fetch(`/api/teams/availability?${q}`)
      .then((res) => res.json())
      .then((json: { ok?: boolean; bookedTeams?: string[] }) => {
        if (cancelled) return;
        setBookedTeams(json.ok && Array.isArray(json.bookedTeams) ? json.bookedTeams : []);
      })
      .catch(() => {
        if (!cancelled) setBookedTeams([]);
      })
      .finally(() => {
        if (!cancelled) setTeamsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isTeamService, state.date, selectedService]);

  useEffect(() => {
    if (!isTeamService || !state.cleaner_id) return;
    if (isBookingTeamName(state.cleaner_id) && bookedTeams.includes(state.cleaner_id)) {
      setState((s) => ({ ...s, cleaner_id: null }));
    }
  }, [bookedTeams, isTeamService, state.cleaner_id, setState]);

  const extrasList = useMemo(
    () => buildExtrasList(formData, selectedService),
    [formData, selectedService]
  );

  const currentService = services.find((s) => s.id === selectedService);

  const fetchCheckoutPricingPreview = useCallback(async () => {
    if (!formData?.pricing || !selectedService || !state.date) {
      throw new Error('Missing booking details for pricing.');
    }
    const extrasQuantities = aggregateExtraQuantitiesByName(
      state.selectedExtraIds,
      extrasQuantitiesById,
      formData.extras.all
    );
    const teamName =
      isTeamService && state.cleaner_id && isBookingTeamName(state.cleaner_id)
        ? state.cleaner_id
        : undefined;
    const previewRes = await fetch('/api/booking/pricing-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: state.date,
        service: selectedService,
        preSurgeTotal: preSurgeTotalZar,
        selected_team: teamName,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        extraRooms: selectedService === 'Carpet' ? 0 : state.extraRooms,
        extras: state.selectedExtraIds,
        extrasQuantities,
        frequency: 'one-time',
        tipAmount: 0,
        discountAmount: 0,
        numberOfCleaners: numberOfCleanersForPricing,
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
    extrasQuantitiesById,
    state.bedrooms,
    state.bathrooms,
    state.extraRooms,
    state.provideEquipment,
    state.cleaner_id,
    preSurgeTotalZar,
    isTeamService,
    carpetDetails,
    numberOfCleanersForPricing,
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
        getBookingDurationMinutes({
          bedrooms: state.bedrooms,
          bathrooms: state.bathrooms,
          extras: state.selectedExtraIds,
          extrasQuantities: extrasQuantitiesById,
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
    extrasQuantitiesById,
  ]);

  const flowCleaners: FlowCleaner[] = useMemo(() => {
    if (isTeamService) {
      return BOOKING_TEAM_NAMES.filter((n) => !bookedTeams.includes(n)).map((name) => ({
        id: name,
        name,
        initial: name.replace(/^Team\s+/i, '').slice(0, 1).toUpperCase() || 'T',
        specialty: 'Coordinated crew',
        rating: '',
        reviews: '',
      }));
    }
    return apiCleaners.map((c) => ({
      id: c.id,
      name: c.name,
      initial: (c.name?.trim()?.[0] || 'C').toUpperCase(),
      specialty: Array.isArray(c.specialties) && c.specialties[0] ? c.specialties[0] : 'Cleaning',
      rating: c.rating != null ? String(Number(c.rating).toFixed(1)) : 'â€”',
      reviews:
        c.completion_rate != null ? `${Math.round(c.completion_rate)}% reliable` : 'â€”',
    }));
  }, [isTeamService, bookedTeams, apiCleaners]);

  const currentCleaner = flowCleaners.find((c) => c.id === state.cleaner_id);

  const displayTotalZar = checkoutFinalZar ?? preSurgeTotalZar;

  const profilePhoneOk = validatePhoneNumber((user.phone || '').trim());

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
      const addr = customerAddressParts;
      if (!addr) {
        throw new Error('Add your street address in Profile before paying.');
      }
      return buildDashboardPendingBookingPayload({
        user: { name: user.name, email: user.email, phone: user.phone || '' },
        address: { line1: addr.line1, suburb: addr.suburb, city: addr.city },
        state: {
          bedrooms: state.bedrooms,
          bathrooms: state.bathrooms,
          extraRooms: state.extraRooms,
          selectedExtraIds: state.selectedExtraIds,
          provideEquipment: state.provideEquipment,
          date: state.date,
          time: state.time,
          cleaner_id: state.cleaner_id,
        },
        selectedService: selectedService as ServiceType,
        isTeamService,
        extrasQuantitiesById,
        carpetDetails,
        linePricing,
        numberOfCleanersForPricing,
        equipmentChargeZar: formData?.equipment?.charge ?? 0,
        finalTotalZar: finalTotalZar,
        preSurge: preSurge,
      });
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
      extrasQuantitiesById,
      numberOfCleanersForPricing,
    ]
  );

  const handleSubmit = async () => {
    setPaymentError(null);
    if (!customerAddressParts) {
      toast.error('Add your street address in Profile before paying.');
      return;
    }
    const phoneRaw = (user.phone || '').trim();
    if (!validatePhoneNumber(phoneRaw)) {
      toast.error('Add a valid phone number in Profile before paying.');
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

  const parsedSummaryDate = parseDateStr(state.date);


  return (
    <BookingFlowView
      steps={STEPS}
      step={step}
      setStep={setStep}
      onBack={onBack}
      formatZar={formatZar}
      services={services}
      selectedService={selectedService}
      onSelectService={(svc) => {
        if (!formData) return;
        setService(bookingServiceInfo(formData, svc.id, svc.name));
      }}
      formData={formData}
      bedrooms={state.bedrooms}
      bathrooms={state.bathrooms}
      extraRooms={state.extraRooms}
      setBedrooms={(n) => setState((s) => ({ ...s, bedrooms: n }))}
      setBathrooms={(n) => setState((s) => ({ ...s, bathrooms: n }))}
      setExtraRooms={(n) => setState((s) => ({ ...s, extraRooms: n }))}
      isCarpet={selectedService === 'Carpet'}
      goDatePrev={goDatePrev}
      goDateNext={goDateNext}
      canGoDatePrev={canGoDatePrev}
      canGoDateNext={canGoDateNext}
      selectableDates={selectableDates}
      stateDate={state.date}
      setDateAndClearTime={(iso) => setState((s) => ({ ...s, date: iso, time: '' }))}
      parsedSummaryDate={parsedSummaryDate}
      timeSlots={timeSlots}
      slotOcc={{ status: slotOcc.status, errorMessage: slotOcc.errorMessage }}
      stateTime={state.time}
      setTime={(id) => setState((s) => ({ ...s, time: id }))}
      firstAvailableSlotId={firstAvailableSlotId}
      abVariant={abVariant}
      onContinueFromStep2={() => {
        if (state.time) trackAb('continue_step2');
        setStep(3);
      }}
      isTeamService={isTeamService}
      cleanersLoading={cleanersLoading}
      teamsLoading={teamsLoading}
      flowCleaners={flowCleaners}
      stateCleanerId={state.cleaner_id}
      setCleanerId={(id) => setState((s) => ({ ...s, cleaner_id: id }))}
      extrasList={extrasList}
      selectedExtraIds={state.selectedExtraIds}
      toggleExtra={toggleExtra}
      provideEquipment={state.provideEquipment}
      setProvideEquipment={(v) => setState((s) => ({ ...s, provideEquipment: v }))}
      equipmentCharge={formData?.equipment?.charge ?? 0}
      showEquipmentOption={
        (selectedService === 'Standard' || selectedService === 'Airbnb') && !!formData?.equipment
      }
      paymentError={paymentError}
      displayAddress={displayAddress}
      hasCustomerAddress={!!customerAddressParts}
      profilePhoneOk={profilePhoneOk}
      paying={paying}
      onPay={handleSubmit}
      displayTotalZar={displayTotalZar}
      linePricing={
        linePricing
          ? {
              subtotal: linePricing.subtotal,
              serviceFee: linePricing.serviceFee,
              frequencyDiscount: linePricing.frequencyDiscount,
            }
          : null
      }
      checkoutFinalZar={checkoutFinalZar}
      currentService={currentService}
      currentCleaner={currentCleaner}
      rewardPoints={user.rewardPoints}
      supportWhatsAppHref={supportWhatsAppHref()}
    />
  );
}
