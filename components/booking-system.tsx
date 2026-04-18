'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  Calendar,
  Home,
  Layers,
  Sparkles,
  Wind,
  RefreshCw,
  Loader2,
  Building2,
  Sofa,
  Award,
  User,
  AppWindow,
  Warehouse,
  Flame,
  Shirt,
  PawPrint,
  Snowflake,
} from 'lucide-react';
import { useBookingFormData, type BookingFormData as BookingFormDataFromApi } from '@/lib/useBookingFormData';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import { supabase } from '@/lib/supabase/client';
import { BookingStep1Cleaning } from '@/components/booking-step1-cleaning';
import { BookingStep2Schedule } from '@/components/booking-step2-schedule';
import { BookingStep3Crew } from '@/components/booking-step3-crew';
import { BookingStep4Confirmation } from '@/components/booking-step4-confirmation';
import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import { getBookingDurationMinutes } from '@/shared/booking-engine/duration';
import { logBookingFlowClient } from '@/lib/debug-booking-flow';
import type { PricingEngineResult } from '@/lib/pricing-engine';
import { estimateBookingDurationRange } from '@/lib/booking-work-hours';
import {
  buildCarpetDetailsForPricing,
  buildExtrasQuantitiesByIdFromWizard,
  formServiceToApi,
  getEffectiveRoomCounts,
  slugifyExtraId,
} from '@/lib/booking-pricing-input';
import {
  computeWizardDisplayPricing,
} from '@/shared/booking-engine/wizard-display-pricing';
import {
  computeWizardEnginePricingRow,
  deriveWizardCompanyCostsCents,
} from '@/shared/booking-engine/wizard-engine-pricing';
import { getWizardOptimalTeamBreakdown } from '@/shared/booking-engine/optimal-team';
import { buildWizardPendingBookingPayload, BOOKING_PROMO_CODES } from '@/shared/booking-engine';
import { useBooking } from '@/shared/booking';
import { BOOKING_FORM_SESSION_KEY } from '@/lib/booking-form-session';

export type { BookingFormData, PropertyType, ServiceType } from '@/components/booking-system-types';

const API_TYPE_TO_SERVICE_ID: Record<string, ServiceType> = {
  'Standard': 'standard',
  'Deep': 'deep',
  'Move In/Out': 'move',
  'Airbnb': 'airbnb',
  'Carpet': 'carpet',
};
/** Legacy step-2 tile ids → stored `BookingFormData.extras` values (`booking-step2-schedule` static EXTRAS). */
const DEEP_MOVE_LEGACY_EXTRA_STORAGE_IDS: readonly string[] = [
  'carpet_deep',
  'ceiling',
  'garage',
  'balcony',
  'couch',
  'exterior_windows',
];

// Icon name (from API) to React node for services
const SERVICE_ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  Building: <Building2 className="w-6 h-6" />,
  Calendar: <Calendar className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
};
// Extra name to icon (for add-ons)
const EXTRA_ICON_MAP: Record<string, React.ReactNode> = {
  'Inside Fridge': <Wind className="w-5 h-5" />,
  'Inside Oven': <Sparkles className="w-5 h-5" />,
  'Interior Windows': <Layers className="w-5 h-5" />,
  'Inside Cabinets': <Home className="w-5 h-5" />,
  'Interior Walls': <ShieldCheck className="w-5 h-5" />,
  'Laundry & Ironing': <RefreshCw className="w-5 h-5" />,
  'Laundry Wash': <RefreshCw className="w-5 h-5" />,
  'Extra Cleaner': <User className="w-5 h-5" />,
  'Supplies Kit': <Award className="w-5 h-5" />,
  'Balcony Cleaning': <Home className="w-5 h-5" />,
  'Carpet Cleaning': <Wind className="w-5 h-5" />,
  'Ceiling Cleaning': <Layers className="w-5 h-5" />,
  'Couch Cleaning': <Sofa className="w-5 h-5" />,
  'Garage Cleaning': <Building2 className="w-5 h-5" />,
  'Mattress Cleaning': <Sparkles className="w-5 h-5" />,
  'Exterior Windows': <Layers className="w-5 h-5" />,
  'Wall Spot Clean': <ShieldCheck className="w-5 h-5" />,
};

/** Icons for DB extra names that don't match `EXTRA_ICON_MAP` keys exactly. */
function resolveExtraIcon(label: string): React.ReactNode {
  const direct = EXTRA_ICON_MAP[label];
  if (direct) return direct;
  const n = label.toLowerCase();
  if (n.includes('balcony') || n.includes('patio')) return <Home className="w-5 h-5" />;
  if (n.includes('garage')) return <Warehouse className="w-5 h-5" />;
  if (n.includes('carpet')) return <Wind className="w-5 h-5" />;
  if (n.includes('couch') || n.includes('sofa')) return <Sofa className="w-5 h-5" />;
  if (n.includes('ceiling')) return <Layers className="w-5 h-5" />;
  if (n.includes('window')) return <AppWindow className="w-5 h-5" />;
  if (n.includes('oven')) return <Flame className="w-5 h-5" />;
  if (n.includes('fridge')) return <Snowflake className="w-5 h-5" />;
  if (n.includes('laundry') || n.includes('folding')) return <RefreshCw className="w-5 h-5" />;
  if (n.includes('iron')) return <Shirt className="w-5 h-5" />;
  if (n.includes('mattress')) return <Sparkles className="w-5 h-5" />;
  if (n.includes('pet')) return <PawPrint className="w-5 h-5" />;
  if (n.includes('wall')) return <ShieldCheck className="w-5 h-5" />;
  return <Sparkles className="w-5 h-5" />;
}

// Service id -> URL slug (move-in-out for move)
const SERVICE_TO_URL_SLUG: Record<ServiceType, string> = {
  standard: 'standard',
  deep: 'deep',
  move: 'move-in-out',
  airbnb: 'airbnb',
  carpet: 'carpet',
};
const URL_SLUG_TO_SERVICE: Record<string, ServiceType> = {
  standard: 'standard',
  deep: 'deep',
  'move-in-out': 'move',
  airbnb: 'airbnb',
  carpet: 'carpet',
};
const STEP_TO_SLUG: Record<number, string> = {
  1: 'plan',
  2: 'time',
  3: 'crew',
  4: 'final',
};
const SLUG_TO_STEP: Record<string, number> = {
  plan: 1,
  time: 2,
  crew: 3,
  final: 4,
};
const BOOKING_STORAGE_KEY = BOOKING_FORM_SESSION_KEY;

// --- HELPERS ---

const generateRef = () => 'SHL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

const formatTimeDisplay = (t: string) => {
  if (!t) return 'TBD';
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-ZA', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const validateEmailFormat = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- COMPONENTS ---

// @component: BookingSystem
interface BookingSystemProps {
  initialFormData?: BookingFormDataFromApi | null;
  initialService?: ServiceType;
}

export const BookingSystem = ({ initialFormData, initialService }: BookingSystemProps = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: formData, loading: formDataLoading, error: formDataError } = useBookingFormData(initialFormData);
  const checkoutPricingRef = useRef<{ preSurgeTotal: number; finalTotal: number } | null>(null);
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathServiceIdx = pathSegments.indexOf('service');
  const serviceSlugFromPath = pathServiceIdx !== -1 && pathServiceIdx + 1 < pathSegments.length
    ? pathSegments[pathServiceIdx + 1]
    : null;
  const serviceFromPath = serviceSlugFromPath ? URL_SLUG_TO_SERVICE[serviceSlugFromPath] : undefined;
  const [step, setStep] = useState(() => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return SLUG_TO_STEP[last] ?? 1;
  });
  const { data, setData, lineCalc } = useBooking({
    apiFormData: formData,
    storageKey: BOOKING_STORAGE_KEY,
    initialService,
    serviceFromPath,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  /** Set when POST /api/bookings/pending returns 409 — user can pay that booking or cancel and retry */
  const [unpaidDuplicateBookingId, setUnpaidDuplicateBookingId] = useState<string | null>(null);
  const [duplicateUnpaidAction, setDuplicateUnpaidAction] = useState<'idle' | 'pay' | 'cancel'>('idle');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [confirmedCheckoutTotalZar, setConfirmedCheckoutTotalZar] = useState<number | null>(null);
  const [session, setSession] = useState<{ user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null>(null);
  const [customerProfile, setCustomerProfile] = useState<{ firstName?: string; lastName?: string; email?: string; phone?: string; rewardsPoints?: number } | null>(null);

  // Session and customer profile for dashboard linking and form prefill
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s ? { user: s.user } : null);
      if (!s?.user) {
        setCustomerProfile(null);
        return;
      }
      // Fetch customer profile for display and prefill
      fetch('/api/dashboard/bookings?limit=1', {
        headers: { Authorization: `Bearer ${s.access_token}` },
      })
        .then((res) => res.json())
        .then((json: { ok?: boolean; customer?: { firstName?: string; lastName?: string; email?: string; phone?: string; rewardsPoints?: number } }) => {
          if (cancelled || !json.ok || !json.customer) return;
          setCustomerProfile({
            firstName: json.customer.firstName,
            lastName: json.customer.lastName,
            email: json.customer.email,
            phone: json.customer.phone ?? undefined,
            rewardsPoints: json.customer.rewardsPoints ?? 0,
          });
        })
        .catch(() => {});
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (cancelled) return;
      setSession(s ? { user: s.user } : null);
      if (!s?.user) setCustomerProfile(null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Prefill contact fields when customer profile loads (only fill if currently empty)
  useEffect(() => {
    if (!customerProfile) return;
    const name = [customerProfile.firstName, customerProfile.lastName].filter(Boolean).join(' ');
    setData((prev) => ({
      ...prev,
      ...(name && !prev.name && { name }),
      ...(customerProfile.email && !prev.email && { email: customerProfile.email }),
      ...(customerProfile.phone && !prev.phone && { phone: customerProfile.phone }),
    }));
  }, [customerProfile]);

  // If Pay Later (Shalean Rewards) is selected but user has no usable balance, reset to Pay Online
  const hasRewardsBalance = (customerProfile?.rewardsPoints ?? 0) > 0;
  useEffect(() => {
    if (!hasRewardsBalance && data.paymentMethod === 'later') {
      setData((prev) => ({ ...prev, paymentMethod: 'online' }));
    }
  }, [hasRewardsBalance, data.paymentMethod]);

  useEffect(() => {
    if (formData?.allowPayLater === false && data.paymentMethod === 'later') {
      setData((prev) => ({ ...prev, paymentMethod: 'online' }));
    }
  }, [formData?.allowPayLater, data.paymentMethod]);

  // Keep step aligned with the URL segment (browser back/forward, manual URL edits)
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] ?? '';
    const fromUrl = SLUG_TO_STEP[last];
    if (fromUrl !== undefined && fromUrl >= 1 && fromUrl <= 4) {
      setStep((s) => (s === fromUrl ? s : fromUrl));
    }
  }, [pathname]);

  // Sync selected service from URL slug so entry points (e.g., homepage hero) always open with the intended service.
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const serviceIdx = segments.indexOf('service');
    if (serviceIdx === -1 || serviceIdx + 1 >= segments.length) return;
    const serviceSlug = segments[serviceIdx + 1];
    const serviceFromUrl = URL_SLUG_TO_SERVICE[serviceSlug];
    if (!serviceFromUrl) return;

    setData((prev) => (prev.service === serviceFromUrl ? prev : { ...prev, service: serviceFromUrl }));
  }, [pathname]);

  const standardAirbnbExtrasKey = useMemo(
    () => (formData?.extras?.standardAndAirbnb ?? []).join('|'),
    [formData?.extras?.standardAndAirbnb]
  );
  const deepMoveExtrasKey = useMemo(
    () => (formData?.extras?.deepAndMove ?? []).join('|'),
    [formData?.extras?.deepAndMove]
  );

  // Drop extras that do not apply to the selected service (ids must stay in sync with step-2 grid)
  useEffect(() => {
    setData((prev) => {
      let allowed: Set<string>;
      if (prev.service === 'standard' || prev.service === 'airbnb') {
        allowed = new Set([
          ...(formData?.extras?.standardAndAirbnb ?? []).map((n) => slugifyExtraId(n)),
          'extra_cleaner',
          'equipment',
        ]);
      } else if (prev.service === 'deep' || prev.service === 'move') {
        allowed = new Set([
          ...(formData?.extras?.deepAndMove ?? []).map((n) => slugifyExtraId(n)),
          ...DEEP_MOVE_LEGACY_EXTRA_STORAGE_IDS,
        ]);
      } else {
        allowed = new Set();
      }
      const next = prev.extras.filter((e) => allowed.has(e));
      if (next.length === prev.extras.length) return prev;
      const nextQuantities = { ...prev.extrasQuantities };
      for (const k of Object.keys(nextQuantities)) {
        if (!next.includes(k)) delete nextQuantities[k];
      }
      return { ...prev, extras: next, extrasQuantities: nextQuantities };
    });
  }, [data.service, standardAirbnbExtrasKey, deepMoveExtrasKey]);

  // Keep URL service slug in sync with selected service (preserve current step from pathname)
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const serviceIdx = segments.indexOf('service');
    if (serviceIdx === -1 || serviceIdx + 2 >= segments.length) return;
    const currentServiceSlug = segments[serviceIdx + 1];
    const currentStepSlug = segments[serviceIdx + 2];
    const expectedServiceSlug = SERVICE_TO_URL_SLUG[data.service];

    if (currentServiceSlug !== expectedServiceSlug) {
      router.replace(`/booking/service/${expectedServiceSlug}/${currentStepSlug}`, { scroll: false });
    }
  }, [data.service, pathname, router]);

  const displayServices = useMemo(() => {
    if (formData?.services?.length) {
      return formData.services
        .map((s) => {
          const id = API_TYPE_TO_SERVICE_ID[s.type];
          if (!id) return null;
          const icon = SERVICE_ICON_MAP[s.icon] ?? <Sparkles className="w-6 h-6" />;
          const price = formData.pricing?.services?.[s.type]?.base ?? 0;
          return { id, title: s.label, description: s.description || s.subLabel, icon, price, color: 'blue' as const };
        })
        .filter(Boolean) as { id: ServiceType; title: string; description: string; icon: React.ReactNode; price: number; color: string }[];
    }
    return [];
  }, [formData]);

  const displayExtrasForService = useMemo(() => {
    if (!formData?.extras) return null;
    const list = data.service === 'standard' || data.service === 'airbnb'
      ? formData.extras.standardAndAirbnb
      : data.service === 'deep' || data.service === 'move'
        ? formData.extras.deepAndMove
        : [];
    const fromApi = list.map((name) => ({
      id: slugifyExtraId(name),
      label: name,
      price: formData.extras.prices[name] ?? 0,
      icon: resolveExtraIcon(name),
    }));
    if (data.service === 'standard' || data.service === 'airbnb') {
      return [
        ...fromApi,
        {
          id: 'extra_cleaner',
          label: 'Extra Cleaner',
          price:
            formData.extras.prices['Extra Cleaner'] ??
            formData.extras.prices['Carpet extra cleaner'] ??
            formData.extras.prices['Carpet occupied property'] ??
            formData.extras.prices['Carpet property occupied'] ??
            0,
          icon: EXTRA_ICON_MAP['Extra Cleaner'] ?? <User className="w-5 h-5" />,
        },
        {
          id: 'equipment',
          label: 'Supplies Kit',
          price: formData.equipment?.charge ?? 0,
          icon: EXTRA_ICON_MAP['Supplies Kit'] ?? <Award className="w-5 h-5" />,
        },
      ];
    }
    return fromApi;
  }, [formData, data.service]);

  const estimatedDuration = useMemo(() => estimateBookingDurationRange(data), [data]);

  const optimalTeam = useMemo(() => getWizardOptimalTeamBreakdown(data), [data]);

  useEffect(() => {
    if (data.teamSizeUserOverride) return;
    setData((d) =>
      d.numberOfCleaners === optimalTeam.teamSize
        ? d
        : { ...d, numberOfCleaners: optimalTeam.teamSize }
    );
  }, [optimalTeam.teamSize, data.teamSizeUserOverride, setData]);

  const companyCostsForEngine = useMemo(
    () => deriveWizardCompanyCostsCents(lineCalc, data.service),
    [lineCalc, data.service]
  );

  const enginePricing = useMemo((): PricingEngineResult | null => {
    return computeWizardEnginePricingRow({
      lineCalc,
      dataService: data.service,
      estimatedMaxHours: estimatedDuration.maxHours,
    });
  }, [lineCalc, data.service, estimatedDuration.maxHours]);

  const pricing = useMemo(() => {
    if (!formData?.pricing) {
      return {
        basePrice: 0,
        bedroomAdd: 0,
        bathroomAdd: 0,
        extraRoomAdd: 0,
        extrasTotal: 0,
        tipAmount: data.tipAmount,
        discountAmount: 0,
        subtotal: 0,
        total: 0,
        serviceFee: 0,
        frequencyDiscount: 0,
        dbPricingRows: [] as { id: string; label: string; value: number }[],
        engineFinalCents: null as number | null,
      };
    }
    return computeWizardDisplayPricing({
      data: {
        service: data.service,
        tipAmount: data.tipAmount,
        promoCode: data.promoCode,
      },
      lineCalc,
      enginePricing,
    });
  }, [data.service, data.tipAmount, data.promoCode, formData?.pricing, lineCalc, enginePricing]);

  const effRoomCounts = useMemo(() => getEffectiveRoomCounts(data), [data]);

  /** Compute expected end time (HH:MM) from start time + max duration hours */
  const expectedEndTime = useMemo(() => {
    if (!data.time) return null;
    const [h, m] = data.time.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + estimatedDuration.maxHours * 60;
    const endH = Math.floor(endMins / 60) % 24;
    const endM = Math.round(endMins % 60);
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }, [data.time, estimatedDuration.maxHours]);

  const [apiCleaners, setApiCleaners] = useState<ApiCleaner[]>([]);
  const [cleanersLoading, setCleanersLoading] = useState(false);
  useEffect(() => {
    if (!data.date || !data.workingArea) {
      setApiCleaners([]);
      return;
    }
    const suburb = data.workingArea.trim();
    let cancelled = false;
    setCleanersLoading(true);
    const params = new URLSearchParams({
      date: data.date,
      suburb,
      city: BOOKING_DEFAULT_CITY,
    });
    if (data.time) params.set('time', data.time);
    params.set(
      'duration_minutes',
      String(
        getBookingDurationMinutes({
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          extras: data.extras,
          extrasQuantities: data.extrasQuantities,
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
    return () => { cancelled = true; };
  }, [data.date, data.workingArea, data.time, data.bedrooms, data.bathrooms, data.extras, data.extrasQuantities]);

  const currentExtras = useMemo(() => {
    if (displayExtrasForService?.length) return displayExtrasForService;
    return [];
  }, [displayExtrasForService]);

  const crewDisplayName = useMemo(() => {
    const teamService = data.service === 'deep' || data.service === 'move';
    if (teamService && !data.cleanerId) {
      return 'Cleaning team';
    }
    const c = apiCleaners.find((x) => x.id === data.cleanerId);
    return c?.name ?? 'Your cleaner';
  }, [data.service, data.cleanerId, apiCleaners]);

  const propertySummaryForStep4 = useMemo(() => {
    if (data.service === 'carpet') {
      return `${effRoomCounts.bedrooms} Carpets, ${effRoomCounts.bathrooms} Rugs${effRoomCounts.extraRooms > 0 ? `, ${effRoomCounts.extraRooms} Extra Crew` : ''}`;
    }
    if (data.propertyType === 'studio') {
      return `${effRoomCounts.bathrooms} Bath, ${effRoomCounts.extraRooms} extra rooms`;
    }
    return `${effRoomCounts.bedrooms} ${data.propertyType === 'office' ? 'Offices' : 'Bed'}, ${effRoomCounts.bathrooms} ${data.propertyType === 'office' ? 'Rooms' : 'Bath'}`;
  }, [data.service, data.propertyType, effRoomCounts]);

  const extrasSummaryForStep4 = useMemo(() => {
    if (data.extras.length === 0) return 'None';
    const labels = data.extras.map((e) => {
      const label = currentExtras.find((ex) => ex.id === e)?.label ?? e;
      const q = data.extrasQuantities[e];
      return q != null && q > 1 ? `${label} ×${q}` : label;
    });
    const equipmentZar =
      (data.service === 'standard' || data.service === 'airbnb') && data.scheduleEquipmentPref === 'bring'
        ? (formData?.equipment?.charge ?? 0)
        : 0;
    const extrasDisplayTotal = pricing.extrasTotal + equipmentZar;
    const zar = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(extrasDisplayTotal);
    return `${labels.join(' + ')} (+${zar})`;
  }, [
    data.extras,
    data.extrasQuantities,
    data.service,
    data.scheduleEquipmentPref,
    currentExtras,
    pricing.extrasTotal,
    formData?.equipment?.charge,
  ]);

  const dateTimeLabelForStep4 = useMemo(
    () => (data.date ? `${formatDate(data.date)} · ${formatTimeDisplay(data.time)}` : 'To be confirmed'),
    [data.date, data.time]
  );

  const shortDateLabelForStep4 = useMemo(() => (data.date ? formatDate(data.date) : ''), [data.date]);

  const validateStep = useCallback(() => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    if (step === 1) {
      if (!data.workingArea) newErrors.workingArea = 'Location is required';
    }
    if (step === 2) {
      if (!data.date) newErrors.date = 'Date is required';
      if (!data.time) newErrors.time = 'Time is required';
      if (data.service === 'standard' || data.service === 'airbnb') {
        if (data.scheduleEquipmentPref !== 'bring' && data.scheduleEquipmentPref !== 'own') {
          newErrors.scheduleEquipmentPref = 'Please choose an equipment option';
        }
      }
    }
    if (step === 4) {
      if (!data.name.trim()) newErrors.name = 'Required';
      if (!data.email.trim()) newErrors.email = 'Valid email required';
      else if (!validateEmailFormat(data.email)) newErrors.email = 'Valid email required';
      if (!data.phone.trim()) newErrors.phone = 'Required';
      if (!data.address.trim()) newErrors.address = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, data]);

  const fetchCheckoutPricingPreview = useCallback(async () => {
    const apiService = formServiceToApi(data.service);
    const requiresTeam = data.service === 'deep' || data.service === 'move';
    const selectedTeam = requiresTeam ? 'Team booking' : undefined;
    const eff = getEffectiveRoomCounts(data);
    const extrasQuantities = buildExtrasQuantitiesByIdFromWizard(data.extras, data.extrasQuantities);
    const previewRes = await fetch('/api/booking/pricing-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: data.date,
        service: apiService,
        preSurgeTotal: pricing.total,
        selected_team: selectedTeam,
        bedrooms: eff.bedrooms,
        bathrooms: eff.bathrooms,
        extraRooms: eff.extraRooms,
        extras: data.extras,
        extrasQuantities,
        frequency: 'one-time',
        tipAmount: data.tipAmount,
        discountAmount: pricing.discountAmount,
        numberOfCleaners: lineCalc?.breakdown.numberOfCleaners ?? 1,
        provideEquipment:
          (data.service === 'standard' || data.service === 'airbnb') &&
          data.scheduleEquipmentPref === 'bring',
        carpetDetails: buildCarpetDetailsForPricing(data),
        pricingEngineFinalCents: pricing.engineFinalCents ?? undefined,
        pricingTotalHours: estimatedDuration.maxHours,
        pricingTeamSize: lineCalc?.breakdown.numberOfCleaners ?? 1,
        equipmentCostCents: companyCostsForEngine?.equipmentCostCents,
        extraCleanerFeeCents: companyCostsForEngine?.extraCleanerFeeCents,
        serviceFee: pricing.serviceFee,
      }),
    });
    const preview = await previewRes.json();
    if (!previewRes.ok || !preview.ok) {
      throw new Error(preview.error || 'Could not confirm pricing for this date.');
    }
    checkoutPricingRef.current = {
      preSurgeTotal: preview.preSurgeTotalZar,
      finalTotal: preview.finalTotalZar,
    };
    setConfirmedCheckoutTotalZar(preview.finalTotalZar);
    return preview as { preSurgeTotalZar: number; finalTotalZar: number };
  }, [
    data,
    pricing.total,
    pricing.discountAmount,
    pricing.engineFinalCents,
    pricing.serviceFee,
    lineCalc,
    estimatedDuration.maxHours,
    companyCostsForEngine,
  ]);

  useEffect(() => {
    if (step !== 4 || !data.date || !data.time) {
      setConfirmedCheckoutTotalZar(null);
      return;
    }

    let cancelled = false;
    fetchCheckoutPricingPreview()
      .then((preview) => {
        if (!cancelled) {
          setConfirmedCheckoutTotalZar(preview.finalTotalZar);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfirmedCheckoutTotalZar(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [step, data.date, data.time, fetchCheckoutPricingPreview]);

  const buildBookingPayload = useCallback(
    (paymentReference: string | null) => {
      const totals = checkoutPricingRef.current;
      return buildWizardPendingBookingPayload(
        data,
        paymentReference,
        expectedEndTime,
        formData?.equipment?.charge,
        {
          pricing: {
            total: pricing.total,
            discountAmount: pricing.discountAmount,
            serviceFee: pricing.serviceFee,
            frequencyDiscount: pricing.frequencyDiscount,
            engineFinalCents: pricing.engineFinalCents,
          },
          lineCalc,
          checkoutPreSurge: totals?.preSurgeTotal,
          checkoutFinal: totals?.finalTotal,
          estimatedMaxHours: estimatedDuration.maxHours,
          companyCosts: companyCostsForEngine,
        }
      );
    },
    [data, pricing, expectedEndTime, formData?.equipment?.charge, companyCostsForEngine, estimatedDuration.maxHours, lineCalc]
  );

  type PaystackCheckoutResult =
    | { ok: true; redirectUrl: string }
    | { ok: false; duplicate: true; existingBookingId: string; message: string };

  const runPaystackCheckoutFlow = useCallback(async (): Promise<PaystackCheckoutResult> => {
    await fetchCheckoutPricingPreview();
    const pendingBody = buildBookingPayload(null);
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
      return {
        ok: false,
        duplicate: true,
        existingBookingId: pendingJson.existingBookingId,
        message:
          pendingJson.error ||
          'You already have an unpaid booking for this slot. Pay for it or cancel it, then try again.',
      };
    }
    if (!pendingRes.ok || !pendingJson.ok) {
      throw new Error(pendingJson.error || 'Could not create booking for payment.');
    }
    const bookingId = pendingJson.bookingId as string;
    const initRes = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    const initData = await initRes.json();
    if (!initRes.ok || !initData.authorization_url) {
      throw new Error(initData.error || 'Could not start payment.');
    }
    return { ok: true, redirectUrl: initData.authorization_url as string };
  }, [buildBookingPayload, fetchCheckoutPricingPreview]);

  const payExistingUnpaidBooking = useCallback(async () => {
    if (!unpaidDuplicateBookingId) return;
    setDuplicateUnpaidAction('pay');
    setPaymentError('');
    try {
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: unpaidDuplicateBookingId }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData.authorization_url) {
        throw new Error(initData.error || 'Could not start payment.');
      }
      window.location.href = initData.authorization_url as string;
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Failed to open payment.');
      setDuplicateUnpaidAction('idle');
    }
  }, [unpaidDuplicateBookingId]);

  const cancelUnpaidDuplicateAndCheckout = useCallback(async () => {
    if (!unpaidDuplicateBookingId) return;
    setDuplicateUnpaidAction('cancel');
    setIsProcessing(true);
    try {
      const res = await fetch('/api/bookings/pending/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: unpaidDuplicateBookingId,
          email: data.email.trim(),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Could not cancel booking.');
      }
      setUnpaidDuplicateBookingId(null);
      setPaymentError('');
      const result = await runPaystackCheckoutFlow();
      if (!result.ok) {
        setPaymentError(result.message);
        setUnpaidDuplicateBookingId(result.existingBookingId);
        setIsProcessing(false);
        return;
      }
      window.location.href = result.redirectUrl;
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Failed to continue checkout.');
      setIsProcessing(false);
    } finally {
      setDuplicateUnpaidAction('idle');
    }
  }, [unpaidDuplicateBookingId, data.email, runPaystackCheckoutFlow]);

  const submitGuestBooking = useCallback(async () => {
    setPaymentError('');
    if (!data.date || !data.time) {
      setPaymentError('Please select a date and time before confirming your booking.');
      setIsProcessing(false);
      return;
    }
    try {
      await fetchCheckoutPricingPreview();
      const body = buildBookingPayload(null);
      const res = await fetch('/api/bookings/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to save booking');
      const ref = result.bookingId || result.id || generateRef();
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const ct =
        typeof result.confirmationToken === 'string' && result.confirmationToken
          ? `&ct=${encodeURIComponent(result.confirmationToken)}`
          : '';
      const confirmPath = `/booking/confirmation?ref=${encodeURIComponent(ref)}${ct}`;
      logBookingFlowClient('POST /api/bookings/guest succeeded → redirect', {
        ref,
        hasConfirmationToken: Boolean(ct),
        path: confirmPath,
      });
      router.push(confirmPath);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Failed to save booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [buildBookingPayload, router, data.date, data.time, fetchCheckoutPricingPreview]);

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === 4) {
      if (data.paymentMethod === 'later') {
        if (formData?.allowPayLater === false) {
          setPaymentError('Pay later is not available. Please pay online.');
          return;
        }
        setIsProcessing(true);
        submitGuestBooking();
        return;
      }
      setPaymentError('');
      setUnpaidDuplicateBookingId(null);

      const paystackKey = (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '').trim();
      /** Local dev: guest booking API allows unpaid confirmation when Paystack key is missing */
      const devGuestCheckout =
        process.env.NODE_ENV === 'development' && !paystackKey;

      if (devGuestCheckout) {
        if (typeof console !== 'undefined') {
          console.warn(
            '[booking] NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set — completing booking without Paystack (development only). Add pk_test_… to .env.local to test card checkout.'
          );
        }
        setIsProcessing(true);
        submitGuestBooking();
        return;
      }

      if (!paystackKey) {
        setPaymentError(
          'Payment system is not configured. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your environment (see .env.example) or contact support.'
        );
        return;
      }
      setIsProcessing(true);
      void (async () => {
        try {
          const result = await runPaystackCheckoutFlow();
          if (!result.ok) {
            setPaymentError(result.message);
            setUnpaidDuplicateBookingId(result.existingBookingId);
            setIsProcessing(false);
            return;
          }
          window.location.href = result.redirectUrl;
        } catch (e) {
          setPaymentError(e instanceof Error ? e.message : 'Failed to open payment. Please try again.');
          setIsProcessing(false);
        }
      })();
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    const serviceSlug = SERVICE_TO_URL_SLUG[data.service];
    const nextStepSlug = STEP_TO_SLUG[nextStep] ?? 'plan';
    router.replace(`/booking/service/${serviceSlug}/${nextStepSlug}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleBack = () => {
    const prevStep = Math.max(1, step - 1);
    if (prevStep === step) return;
    setStep(prevStep);
    const serviceSlug = SERVICE_TO_URL_SLUG[data.service];
    const prevStepSlug = STEP_TO_SLUG[prevStep] ?? 'plan';
    router.replace(`/booking/service/${serviceSlug}/${prevStepSlug}`, { scroll: false });
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a code');
      return;
    }
    if (BOOKING_PROMO_CODES[code]) {
      setData(prev => ({
        ...prev,
        promoCode: code
      }));
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try SHALEAN10, SAVE50, or NEWCLIENT.');
    }
  };
  if (formDataLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading booking options...</p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <BookingStep2Schedule
        data={data}
        setData={setData}
        onBack={handleBack}
        onContinue={handleNext}
        pricing={pricing}
        serviceTitle={displayServices.find((s) => s.id === data.service)?.title ?? 'Cleaning'}
        addonTilesFromPricing={
          data.service === 'deep' ||
          data.service === 'move' ||
          data.service === 'standard' ||
          data.service === 'airbnb'
            ? formData?.extras
              ? (displayExtrasForService ?? [])
              : undefined
            : undefined
        }
      />
    );
  }

  if (step === 1) {
    return (
      <BookingStep1Cleaning
        data={data}
        setData={setData}
        onBack={() => router.push('/')}
        onContinue={handleNext}
        liveTotalZar={pricing.total}
        durationLabel={estimatedDuration.label}
        pricingEngineEstimate={enginePricing}
        dbPricingRows={pricing.dbPricingRows}
        servicePricing={formData?.pricing?.services}
        extraCleanerPriceZar={
          formData?.extras?.prices?.['Carpet occupied property'] ??
          formData?.extras?.prices?.['Carpet property occupied'] ??
          formData?.extras?.prices?.['Carpet extra cleaner'] ??
          formData?.extras?.prices?.['Extra Cleaner']
        }
      />
    );
  }

  if (step === 3) {
    return (
      <BookingStep3Crew
        data={data}
        setData={setData}
        onBack={handleBack}
        onContinue={handleNext}
        pricingTotalZar={pricing.total}
        serviceTitle={displayServices.find((s) => s.id === data.service)?.title ?? 'Cleaning'}
        apiCleaners={apiCleaners}
        cleanersLoading={cleanersLoading}
        formatDate={formatDate}
        optimalTeam={optimalTeam}
      />
    );
  }

  if (step === 4) {
    const serviceTitle = displayServices.find((s) => s.id === data.service)?.title ?? 'Cleaning';
    return (
      <BookingStep4Confirmation
        data={data}
        setData={setData}
        errors={errors}
        setErrors={setErrors}
        paymentError={paymentError}
        unpaidDuplicateBookingId={unpaidDuplicateBookingId}
        onPayExistingUnpaidBooking={payExistingUnpaidBooking}
        onCancelUnpaidDuplicate={cancelUnpaidDuplicateAndCheckout}
        duplicateUnpaidAction={duplicateUnpaidAction}
        promoInput={promoInput}
        setPromoInput={setPromoInput}
        promoError={promoError}
        setPromoError={setPromoError}
        onApplyPromo={handleApplyPromo}
        onBack={handleBack}
        onFinalize={handleNext}
        isProcessing={isProcessing}
        showLoginCta={!session}
        onLogin={() =>
          router.push(
            '/login?redirect=' +
              encodeURIComponent(`/booking/service/${SERVICE_TO_URL_SLUG[data.service]}/plan`)
          )
        }
        serviceTitle={serviceTitle}
        propertySummary={propertySummaryForStep4}
        dateTimeLabel={dateTimeLabelForStep4}
        shortDateLabel={shortDateLabelForStep4}
        cleanerLabel={crewDisplayName}
        cleanerPhotoUrl={
          data.teamId ? null : apiCleaners.find((c) => c.id === data.cleanerId)?.photo_url ?? null
        }
        extrasSummary={extrasSummaryForStep4}
        totalZar={confirmedCheckoutTotalZar ?? pricing.total}
        discountAmount={pricing.discountAmount}
        appliedPromoCode={data.promoCode}
      />
    );
  }

  if (step === 5) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" aria-hidden />
        <span className="sr-only">Redirecting to confirmation…</span>
      </div>
    );
  }

  return null;
};

export default BookingSystem;
