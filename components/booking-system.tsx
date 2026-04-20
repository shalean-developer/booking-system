'use client';

import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
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
import type { TeamSelection } from '@/lib/constants/booking-teams';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import { getBookingDurationMinutes } from '@/shared/booking-engine/duration';
import { logBookingFlowClient } from '@/lib/debug-booking-flow';
import type { PricingEngineResult } from '@/lib/pricing-engine';
import { estimateBookingDurationRange } from '@/lib/booking-work-hours';
import { calculateBookingUnified } from '@/lib/pricing/calculateBookingUnified';
import type { FinalPriceBreakdown } from '@/lib/pricing/final-pricing';
import { isBasicPlannedPathExtrasValid } from '@/lib/pricing-mode';
import { buildWizardTimeInput } from '@/lib/time-estimation';
import {
  buildCarpetDetailsForPricing,
  buildExtrasQuantitiesByIdFromWizard,
  formServiceToApi,
  getEffectiveRoomCounts,
  slugifyExtraId,
} from '@/lib/booking-pricing-input';
import {
  computeWizardDisplayPricing,
  type WizardDisplayPricing,
} from '@/shared/booking-engine/wizard-display-pricing';
import {
  computeWizardEnginePricingRow,
  getWizardEngineCompanyCostsCents,
} from '@/shared/booking-engine/wizard-engine-pricing';
import { getWizardOptimalTeamBreakdown } from '@/shared/booking-engine/optimal-team';
import {
  buildWizardPendingBookingPayload,
  BOOKING_PROMO_CODES,
  isBookingTeamName,
} from '@/shared/booking-engine';
import { useBooking } from '@/shared/booking';
import { BOOKING_FORM_SESSION_KEY } from '@/lib/booking-form-session';

export type { BookingFormData, PropertyType, ServiceType, PricingMode } from '@/components/booking-system-types';

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
  const checkoutPricingRef = useRef<{ price_zar: number; total_amount_cents: number } | null>(null);
  const checkoutPricingIntegrityRef = useRef<{
    pricing_hash: string;
    pricing_snapshot: Record<string, unknown> | null;
    pricing_version: string | null;
    pricing_expires_at: string | null;
    pricing_lock_token: string | null;
  } | null>(null);
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

  /** Quick Clean: planned hours from unified table + extras. */
  useLayoutEffect(() => {
    if (data.pricingMode !== 'basic') return;
    if (data.service !== 'standard' && data.service !== 'airbnb') return;
    const uni = calculateBookingUnified({
      service_type: data.service === 'standard' ? 'standard' : 'airbnb',
      pricing_mode: 'quick',
      bedrooms: Math.max(1, data.bedrooms),
      bathrooms: Math.max(0, data.bathrooms ?? 0),
      extra_rooms: Math.max(0, data.extraRooms ?? 0),
      extras: data.extras ?? [],
      extrasQuantities: data.extrasQuantities,
      has_extra_cleaner: false,
    });
    const h = uni.hours;
    if (data.basicPlannedHours !== h) {
      setData((p) => ({ ...p, basicPlannedHours: h }));
    }
  }, [
    data.pricingMode,
    data.service,
    data.bedrooms,
    data.bathrooms,
    data.extraRooms,
    data.extras,
    data.extrasQuantities,
    data.basicPlannedHours,
    setData,
  ]);

  /** Quick Clean (basic): Extra Cleaner + Supplies Kit are not offered — drop if present in session. */
  useLayoutEffect(() => {
    if (data.pricingMode !== 'basic') return;
    const stripIds = new Set(['extra_cleaner', 'equipment']);
    setData((prev) => {
      const next = prev.extras.filter((e) => !stripIds.has(e));
      if (next.length === prev.extras.length) return prev;
      const nextQ = { ...prev.extrasQuantities };
      for (const id of stripIds) delete nextQ[id];
      return { ...prev, extras: next, extrasQuantities: nextQ };
    });
  }, [data.pricingMode, setData]);

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  /** Set when POST /api/bookings/pending returns 409 — user can pay that booking or cancel and retry */
  const [unpaidDuplicateBookingId, setUnpaidDuplicateBookingId] = useState<string | null>(null);
  const [duplicateUnpaidAction, setDuplicateUnpaidAction] = useState<'idle' | 'pay' | 'cancel'>('idle');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [confirmedCheckoutTotalZar, setConfirmedCheckoutTotalZar] = useState<number | null>(null);
  const [step1AuthoritativeTotalZar, setStep1AuthoritativeTotalZar] = useState<number | null>(null);
  const [session, setSession] = useState<{ user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null>(null);
  const [customerProfile, setCustomerProfile] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressSuburb?: string;
    addressCity?: string;
    rewardsPoints?: number;
  } | null>(null);
  const [applyLoyaltyPoints, setApplyLoyaltyPoints] = useState(false);
  const [useLoyaltyPointsInput, setUseLoyaltyPointsInput] = useState(0);

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
        .then((json: {
          ok?: boolean;
          customer?: {
            firstName?: string;
            lastName?: string;
            email?: string;
            phone?: string;
            addressLine1?: string;
            addressSuburb?: string;
            addressCity?: string;
            rewardsPoints?: number;
          };
        }) => {
          if (cancelled || !json.ok || !json.customer) return;
          setCustomerProfile({
            firstName: json.customer.firstName,
            lastName: json.customer.lastName,
            email: json.customer.email,
            phone: json.customer.phone ?? undefined,
            addressLine1: json.customer.addressLine1 ?? undefined,
            addressSuburb: json.customer.addressSuburb ?? undefined,
            addressCity: json.customer.addressCity ?? undefined,
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
    const profileAddress = [customerProfile.addressLine1, customerProfile.addressSuburb]
      .filter(Boolean)
      .join(', ')
      .trim();
    const profileWorkingArea = customerProfile.addressSuburb?.trim() || customerProfile.addressCity?.trim() || '';
    setData((prev) => ({
      ...prev,
      ...(name && !prev.name && { name }),
      ...(customerProfile.email && !prev.email && { email: customerProfile.email }),
      ...(customerProfile.phone && !prev.phone && { phone: customerProfile.phone }),
      ...(profileAddress && !prev.address && { address: profileAddress }),
      ...(profileWorkingArea && !prev.workingArea && { workingArea: profileWorkingArea }),
    }));
  }, [customerProfile]);

  useEffect(() => {
    const sessionEmail = session?.user?.email?.trim();
    if (!sessionEmail) return;
    setData((prev) => (prev.email?.trim() ? prev : { ...prev, email: sessionEmail }));
  }, [session?.user?.email, setData]);

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
      if (data.pricingMode === 'basic') {
        return fromApi;
      }
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
  }, [formData, data.service, data.pricingMode]);

  const estimatedDuration = useMemo(() => estimateBookingDurationRange(data), [data]);

  const optimalTeam = useMemo(
    () => getWizardOptimalTeamBreakdown(data, formData?.quickCleanSettings),
    [data, formData?.quickCleanSettings]
  );

  useEffect(() => {
    if (data.teamSizeUserOverride) return;
    setData((d) =>
      d.numberOfCleaners === optimalTeam.teamSize
        ? d
        : { ...d, numberOfCleaners: optimalTeam.teamSize }
    );
  }, [optimalTeam.teamSize, data.teamSizeUserOverride, setData]);

  const companyCostsForEngine = useMemo(
    () =>
      lineCalc
        ? getWizardEngineCompanyCostsCents({
            wizard: data,
            lineCalc,
            catalogExtraNames: formData?.extras.all,
          })
        : null,
    [lineCalc, data, formData?.extras.all]
  );

  const enginePricing = useMemo((): PricingEngineResult | null => {
    return computeWizardEnginePricingRow({
      lineCalc,
      dataService: data.service,
      wizard: data,
      catalogExtraNames: formData?.extras.all,
      quickCleanSettings: formData?.quickCleanSettings,
    });
  }, [lineCalc, data.service, data, data.pricingMode, formData?.extras.all, formData?.quickCleanSettings]);

  const pricing = useMemo(() => {
    const canQuickCleanDisplay =
      data.pricingMode === 'basic' &&
      (data.service === 'standard' || data.service === 'airbnb');

    /** Without API pricing, `lineCalc` is null — still run display pricing for Quick Clean via tier + extras. */
    if (!formData?.pricing && !canQuickCleanDisplay) {
      return {
        tipAmount: data.tipAmount,
        discountAmount: 0,
        subtotal: 0,
        total: 0,
        serviceFee: 0,
        frequencyDiscount: 0,
        dbPricingRows: [] as { id: string; label: string; value: number }[],
        engineFinalCents: null as number | null,
        v2Breakdown: null,
        engineMeta: null as WizardDisplayPricing['engineMeta'],
      };
    }
    return computeWizardDisplayPricing({
      data: {
        service: data.service,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        extraRooms: data.extraRooms,
        tipAmount: data.tipAmount,
        promoCode: data.promoCode,
        pricingMode: data.pricingMode,
        scheduleEquipmentPref: data.scheduleEquipmentPref,
        extras: data.extras,
        extrasQuantities: data.extrasQuantities,
      },
      lineCalc,
      enginePricing,
      quickCleanSettings: formData?.quickCleanSettings,
    });
  }, [
    data.service,
    data.bedrooms,
    data.bathrooms,
    data.extraRooms,
    data.tipAmount,
    data.promoCode,
    data.pricingMode,
    data.scheduleEquipmentPref,
    data.extras,
    data.extrasQuantities,
    formData?.pricing,
    formData?.quickCleanSettings,
    lineCalc,
    enginePricing,
  ]);

  const loyaltyBalance = Math.max(0, Math.round(Number(customerProfile?.rewardsPoints) || 0));
  const showLoyaltyInWizard =
    (data.service === 'standard' || data.service === 'airbnb') &&
    loyaltyBalance > 0 &&
    Boolean(session);

  const effectiveLoyaltyUsePoints = useMemo(() => {
    if (!applyLoyaltyPoints || !showLoyaltyInWizard) return 0;
    const raw = Math.max(0, Math.floor(useLoyaltyPointsInput || 0));
    return Math.min(raw, loyaltyBalance);
  }, [applyLoyaltyPoints, showLoyaltyInWizard, useLoyaltyPointsInput, loyaltyBalance]);

  useEffect(() => {
    if (applyLoyaltyPoints && loyaltyBalance > 0) {
      setUseLoyaltyPointsInput((prev) =>
        prev <= 0 ? loyaltyBalance : Math.min(prev, loyaltyBalance),
      );
    }
  }, [applyLoyaltyPoints, loyaltyBalance]);

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

  const shortDateLabelForStep4 = useMemo(() => (data.date ? formatDate(data.date) : ''), [data.date]);

  const addressLineForStep4 = useMemo(() => {
    const a = data.address?.trim();
    const w = data.workingArea?.trim();
    if (a && w) return `${a} · ${w}`;
    return a || w || 'Your area';
  }, [data.address, data.workingArea]);

  const summaryDateTimeForStep4 = useMemo(
    () => (data.date ? `${formatDate(data.date).replace(',', '')} · ${formatTimeDisplay(data.time)}` : 'TBC'),
    [data.date, data.time]
  );

  const selectedCleanerForStep4 = useMemo(() => {
    if (!data.cleanerId) return null;
    const cleaner = apiCleaners.find((c) => c.id === data.cleanerId);
    if (!cleaner) return null;
    return {
      name: cleaner.name,
      photoUrl: cleaner.photo_url ?? null,
      rating: Number.isFinite(cleaner.rating) ? cleaner.rating : 0,
      reviewCount: cleaner.reviews_count ?? 0,
    };
  }, [data.cleanerId, apiCleaners]);

  /** Tips are handled after the job; keep checkout totals free of tip on the final step. */
  useEffect(() => {
    if (step !== 4) return;
    setData((p) => (p.tipAmount === 0 ? p : { ...p, tipAmount: 0 }));
  }, [step, setData]);

  const validateStep = useCallback(() => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    if (step === 1) {
      if (!data.workingArea?.trim()) newErrors.workingArea = 'Location is required';
      if (data.pricingMode === 'basic') {
        if (
          data.basicPlannedHours == null ||
          data.basicPlannedHours < 2 ||
          data.basicPlannedHours > 6
        ) {
          newErrors.basicPlannedHours = 'Invalid duration — please refresh and try again';
        }
      }
    }
    if (step === 2) {
      if (!data.date) newErrors.date = 'Date is required';
      if (!data.time) newErrors.time = 'Time is required';
      if (data.service === 'standard' || data.service === 'airbnb') {
        if (data.scheduleEquipmentPref !== 'bring' && data.scheduleEquipmentPref !== 'own') {
          newErrors.scheduleEquipmentPref = 'Please choose an equipment option';
        }
      }
      if (data.pricingMode === 'basic') {
        const t = buildWizardTimeInput(data, formData?.extras.all);
        if (!isBasicPlannedPathExtrasValid(t, data.extras)) {
          newErrors.pricingMode =
            'Quick Clean allows one cleaner and no heavy add-ons. Switch to Premium Clean or adjust your selections.';
        }
      }
    }
    if (step === 4) {
      if (!data.phone.trim()) newErrors.phone = 'Required';
      const effEmail = data.email.trim() || session?.user?.email?.trim() || '';
      if (!effEmail) newErrors.email = 'Add your email for confirmation';
      else if (!validateEmailFormat(effEmail)) newErrors.email = 'Valid email required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, data, formData?.extras.all, session?.user?.email]);

  const fetchCheckoutPricingPreview = useCallback(async () => {
    const apiService = formServiceToApi(data.service);
    const requiresTeam = data.service === 'deep' || data.service === 'move';
    const selectedTeam =
      requiresTeam && data.teamId && isBookingTeamName(data.teamId) ? data.teamId : undefined;
    const team_selection: TeamSelection | undefined = requiresTeam
      ? selectedTeam
        ? { type: 'manual', team: selectedTeam }
        : { type: 'auto' }
      : undefined;
    const eff = getEffectiveRoomCounts(data);
    const extrasQuantities = buildExtrasQuantitiesByIdFromWizard(data.extras, data.extrasQuantities);
    const previewRes = await fetch('/api/booking/verify-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: data.date,
        time: data.time,
        service: apiService,
        ...(team_selection ? { team_selection } : {}),
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
        serviceFee: data.pricingMode === 'basic' ? 0 : pricing.serviceFee,
        pricingMode: data.pricingMode,
        basicPlannedHours: data.basicPlannedHours ?? undefined,
        scheduleEquipmentPref: data.scheduleEquipmentPref,
        address: {
          suburb: data.workingArea?.trim() || data.address.split(',')[0]?.trim() || data.address,
          city: BOOKING_DEFAULT_CITY,
        },
        discountCode: data.promoCode || undefined,
        promo_code: data.promoCode || undefined,
        customerEmail: data.email?.trim() || session?.user?.email?.trim() || undefined,
        use_points: effectiveLoyaltyUsePoints,
        client_total: pricing.total,
      }),
    });
    const preview = await previewRes.json();
    const previewAccepted = preview.success === true || preview.ok === true;
    if (!previewAccepted) {
      throw new Error(preview.error || 'Could not confirm pricing for this date.');
    }
    checkoutPricingRef.current = {
      price_zar: preview.price_zar,
      total_amount_cents: preview.total_amount_cents,
    };
    checkoutPricingIntegrityRef.current = {
      pricing_hash: String(preview.pricing_hash || ''),
      pricing_snapshot:
        preview.pricing_snapshot && typeof preview.pricing_snapshot === 'object'
          ? (preview.pricing_snapshot as Record<string, unknown>)
          : null,
      pricing_version:
        typeof (preview as { pricing_version?: unknown }).pricing_version === 'string'
          ? (preview as { pricing_version: string }).pricing_version
          : null,
      pricing_expires_at:
        typeof (preview as { pricing_expires_at?: unknown }).pricing_expires_at === 'string'
          ? (preview as { pricing_expires_at: string }).pricing_expires_at
          : null,
      pricing_lock_token:
        typeof (preview as { pricing_lock_token?: unknown }).pricing_lock_token === 'string'
          ? (preview as { pricing_lock_token: string }).pricing_lock_token
          : null,
    };
    setConfirmedCheckoutTotalZar(preview.server_total ?? preview.price_zar);
    return preview as {
      server_total: number;
      price_zar: number;
      total_amount_cents: number;
      breakdown: FinalPriceBreakdown;
      pricing_hash: string;
      pricing_snapshot: Record<string, unknown> | null;
      pricing_version: string;
      pricing_expires_at: string;
      pricing_lock_token: string | null;
    };
  }, [
    data,
    pricing.discountAmount,
    pricing.engineFinalCents,
    pricing.serviceFee,
    lineCalc,
    estimatedDuration.maxHours,
    companyCostsForEngine,
    data.pricingMode,
    data.time,
    data.address,
    data.email,
    data.promoCode,
    effectiveLoyaltyUsePoints,
    session?.user?.email,
  ]);

  useEffect(() => {
    if (step !== 1) {
      setStep1AuthoritativeTotalZar(null);
      return;
    }
    if ((data.service !== 'standard' && data.service !== 'airbnb') || !data.workingArea?.trim()) {
      setStep1AuthoritativeTotalZar(null);
      return;
    }

    let cancelled = false;
    const toYmd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const run = async () => {
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        let chosen: { date: string; time: string } | null = null;
        for (let i = 0; i < 14; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const date = toYmd(d);
          const availRes = await fetch('/api/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              suburb: data.workingArea?.trim() || '',
              city: BOOKING_DEFAULT_CITY,
              service_type: data.service === 'airbnb' ? 'airbnb' : 'standard',
              pricing_mode: data.pricingMode === 'basic' ? 'quick' : 'premium',
              bedrooms: data.bedrooms,
              bathrooms: data.bathrooms,
              extra_rooms: data.extraRooms,
              extras: data.extras,
              extrasQuantities: data.extrasQuantities,
              has_extra_cleaner: data.extras.includes('extra_cleaner'),
            }),
          });
          const availJson = (await availRes.json().catch(() => null)) as
            | {
                ok?: boolean;
                slots?: Array<{ start: string; available: boolean; recommended?: boolean }>;
              }
            | null;
          if (!availRes.ok || !availJson?.ok || !Array.isArray(availJson.slots)) continue;
          const slot =
            availJson.slots.find((s) => s.available && s.recommended) ??
            availJson.slots.find((s) => s.available);
          if (slot?.start) {
            chosen = { date, time: slot.start };
            break;
          }
        }

        if (!chosen) {
          if (!cancelled) setStep1AuthoritativeTotalZar(null);
          return;
        }

        const apiService = formServiceToApi(data.service);
        const requiresTeam = data.service === 'deep' || data.service === 'move';
        const selectedTeam =
          requiresTeam && data.teamId && isBookingTeamName(data.teamId) ? data.teamId : undefined;
        const team_selection: TeamSelection | undefined = requiresTeam
          ? selectedTeam
            ? { type: 'manual', team: selectedTeam }
            : { type: 'auto' }
          : undefined;
        const eff = getEffectiveRoomCounts(data);
        const extrasQuantities = buildExtrasQuantitiesByIdFromWizard(data.extras, data.extrasQuantities);

        const previewRes = await fetch('/api/booking/verify-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: chosen.date,
            time: chosen.time,
            service: apiService,
            ...(team_selection ? { team_selection } : {}),
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
            serviceFee: data.pricingMode === 'basic' ? 0 : pricing.serviceFee,
            pricingMode: data.pricingMode,
            basicPlannedHours: data.basicPlannedHours ?? undefined,
            scheduleEquipmentPref: data.scheduleEquipmentPref,
            address: {
              suburb: data.workingArea?.trim() || data.address.split(',')[0]?.trim() || data.address,
              city: BOOKING_DEFAULT_CITY,
            },
            discountCode: data.promoCode || undefined,
            promo_code: data.promoCode || undefined,
            customerEmail: data.email?.trim() || session?.user?.email?.trim() || undefined,
            use_points: effectiveLoyaltyUsePoints,
            client_total: pricing.total,
          }),
        });
        const preview = (await previewRes.json().catch(() => null)) as
          | { success?: boolean; ok?: boolean; price_zar?: number }
          | null;
        const ok = preview?.success === true || preview?.ok === true;
        if (!cancelled) {
          setStep1AuthoritativeTotalZar(ok && typeof preview?.price_zar === 'number' ? preview.price_zar : null);
        }
      } catch {
        if (!cancelled) setStep1AuthoritativeTotalZar(null);
      }
    };

    const t = window.setTimeout(run, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [
    step,
    data.service,
    data.workingArea,
    data.pricingMode,
    data.bedrooms,
    data.bathrooms,
    data.extraRooms,
    data.extras,
    data.extrasQuantities,
    data.tipAmount,
    data.scheduleEquipmentPref,
    data.teamId,
    data.address,
    data.promoCode,
    data.email,
    data.basicPlannedHours,
    pricing.discountAmount,
    pricing.total,
    pricing.engineFinalCents,
    pricing.serviceFee,
    lineCalc,
    estimatedDuration.maxHours,
    companyCostsForEngine,
    effectiveLoyaltyUsePoints,
    session?.user?.email,
  ]);

  useEffect(() => {
    if (step < 2 || !data.date || !data.time) {
      setConfirmedCheckoutTotalZar(null);
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(() => {
      fetchCheckoutPricingPreview()
        .then((preview) => {
          if (!cancelled) {
            setConfirmedCheckoutTotalZar(preview.price_zar);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setConfirmedCheckoutTotalZar(null);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [step, data.date, data.time, fetchCheckoutPricingPreview, effectiveLoyaltyUsePoints, applyLoyaltyPoints]);

  const buildBookingPayload = useCallback(
    (paymentReference: string | null) => {
      const totals = checkoutPricingRef.current;
      const integrity = checkoutPricingIntegrityRef.current;
      const profileName = [customerProfile?.firstName, customerProfile?.lastName].filter(Boolean).join(' ');
      const merged: BookingFormData = {
        ...data,
        email: data.email.trim() || session?.user?.email?.trim() || data.email,
        name: data.name.trim() || profileName || data.name,
        address: data.address.trim() || data.workingArea.trim() || data.address,
      };
      const payload = buildWizardPendingBookingPayload(
        merged,
        paymentReference,
        expectedEndTime,
        formData?.equipment?.charge,
        {
          pricing: {
            total: pricing.total,
            discountAmount: pricing.discountAmount,
            serviceFee: data.pricingMode === 'basic' ? 0 : pricing.serviceFee,
            frequencyDiscount: pricing.frequencyDiscount,
            engineFinalCents: pricing.engineFinalCents,
          },
          lineCalc,
          checkoutTotalZar: totals?.price_zar,
          estimatedMaxHours: estimatedDuration.maxHours,
          companyCosts: companyCostsForEngine,
          use_points: effectiveLoyaltyUsePoints,
        }
      );
      if (integrity?.pricing_hash) {
        (payload as unknown as Record<string, unknown>).pricing_hash = integrity.pricing_hash;
      }
      if (integrity?.pricing_snapshot) {
        (payload as unknown as Record<string, unknown>).pricing_snapshot = integrity.pricing_snapshot;
      }
      if (integrity?.pricing_version) {
        (payload as unknown as Record<string, unknown>).pricing_version = integrity.pricing_version;
      }
      if (integrity?.pricing_expires_at) {
        (payload as unknown as Record<string, unknown>).pricing_expires_at = integrity.pricing_expires_at;
      }
      if (integrity?.pricing_lock_token) {
        (payload as unknown as Record<string, unknown>).pricing_lock_token = integrity.pricing_lock_token;
      }
      (payload as unknown as Record<string, unknown>).idempotency_key = [
        merged.email.trim().toLowerCase(),
        merged.service,
        merged.date,
        merged.time,
      ].join('|');
      return payload;
    },
    [
      data,
      pricing,
      expectedEndTime,
      formData?.equipment?.charge,
      companyCostsForEngine,
      estimatedDuration.maxHours,
      lineCalc,
      effectiveLoyaltyUsePoints,
      session?.user?.email,
      customerProfile?.firstName,
      customerProfile?.lastName,
    ]
  );

  type PaystackCheckoutResult =
    | { ok: true; redirectUrl: string }
    | { ok: false; duplicate: true; existingBookingId: string; message: string };

  const runPaystackCheckoutFlow = useCallback(async (allowRetry = true): Promise<PaystackCheckoutResult> => {
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
      code?: string;
      message?: string;
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
    if (
      pendingRes.status === 409 &&
      typeof pendingJson.bookingId === 'string' &&
      pendingJson.bookingId
    ) {
      return {
        ok: false,
        duplicate: true,
        existingBookingId: pendingJson.bookingId,
        message:
          pendingJson.error ||
          pendingJson.message ||
          'You already have an unpaid booking for this slot. Pay for it or cancel it, then try again.',
      };
    }
    if (pendingRes.status === 409 && pendingJson.code === 'PRICING_EXPIRED' && allowRetry) {
      await fetchCheckoutPricingPreview();
      return runPaystackCheckoutFlow(false);
    }
    if (
      pendingRes.status === 400 &&
      pendingJson.error &&
      pendingJson.error.includes('Total does not match server pricing') &&
      typeof (pendingJson as { server_total?: unknown }).server_total === 'number'
    ) {
      const serverTotal = (pendingJson as { server_total: number }).server_total;
      checkoutPricingRef.current = {
        price_zar: serverTotal,
        total_amount_cents: Math.round(serverTotal * 100),
      };
      setConfirmedCheckoutTotalZar(serverTotal);
      throw new Error('Price updated due to latest availability. Please review the new total and tap Pay now again.');
    }
    if (!pendingRes.ok || !pendingJson.ok) {
      throw new Error(
        pendingJson.error ||
          pendingJson.message ||
          pendingJson.code ||
          'Could not create booking for payment.'
      );
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
          email: data.email.trim() || session?.user?.email?.trim() || '',
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
  }, [unpaidDuplicateBookingId, data.email, session?.user?.email, runPaystackCheckoutFlow]);

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

  const startCheckout = useCallback(() => {
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
    const devGuestCheckout = process.env.NODE_ENV === 'development' && !paystackKey;

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
  }, [data.paymentMethod, formData?.allowPayLater, submitGuestBooking, runPaystackCheckoutFlow]);

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === 4) {
      startCheckout();
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
  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a code');
      return;
    }
    if (BOOKING_PROMO_CODES[code]) {
      setData((prev) => ({ ...prev, promoCode: code }));
      setPromoError('');
      return;
    }
    setPromoError('');
    try {
      const apiService = formServiceToApi(data.service);
      const subtotal = pricing.total + pricing.discountAmount;
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          service_type: apiService,
          subtotal,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && j.ok) {
        setData((prev) => ({ ...prev, promoCode: code }));
        setPromoError('');
      } else {
        setPromoError(j.error || 'Invalid or expired promo code.');
      }
    } catch {
      setPromoError('Could not validate code. Try again.');
    }
  };

  const displayTotalFromStep2 = step >= 2 && confirmedCheckoutTotalZar != null
    ? confirmedCheckoutTotalZar
    : pricing.total;

  if (formDataLoading && !formData) {
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
        pricingModeError={errors.pricingMode}
        pricing={{ ...pricing, total: displayTotalFromStep2 }}
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
        summaryTone={data.pricingMode}
        liveTotalZar={step1AuthoritativeTotalZar ?? pricing.total}
        earliestSlotPriceHint={step1AuthoritativeTotalZar != null}
        durationLabel={estimatedDuration.label}
        engineMeta={pricing.engineMeta}
        pricingContext={
          pricing.engineMeta
            ? {
                estimatedJobHours:
                  pricing.engineMeta.estimatedHours ?? pricing.engineMeta.estimatedJobHours,
                teamSize: pricing.engineMeta.teamSize,
              }
            : {
                estimatedJobHours: optimalTeam.totalWorkHours,
                teamSize: optimalTeam.teamSize,
              }
        }
        dbPricingRows={pricing.dbPricingRows}
        pricingV2={pricing.v2Breakdown}
        servicePricing={formData?.pricing?.services}
        extraCleanerPriceZar={
          formData?.extras?.prices?.['Carpet occupied property'] ??
          formData?.extras?.prices?.['Carpet property occupied'] ??
          formData?.extras?.prices?.['Carpet extra cleaner'] ??
          formData?.extras?.prices?.['Extra Cleaner']
        }
        quickCleanSettings={formData?.quickCleanSettings}
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
        pricing={{ ...pricing, total: displayTotalFromStep2 }}
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
        summaryDateTime={summaryDateTimeForStep4}
        addressLine={addressLineForStep4}
        numberOfCleaners={lineCalc?.breakdown.numberOfCleaners ?? 1}
        workHoursLabel={
          data.time && expectedEndTime
            ? `${formatTimeDisplay(data.time)} - ${formatTimeDisplay(expectedEndTime)} (${estimatedDuration.label})`
            : estimatedDuration.label
        }
        selectedCleaner={selectedCleanerForStep4}
        shortDateLabel={shortDateLabelForStep4}
        totalZar={displayTotalFromStep2}
        discountAmount={pricing.discountAmount}
        appliedPromoCode={data.promoCode}
        accountEmail={session?.user?.email ?? null}
        showLoyaltyBlock={showLoyaltyInWizard}
        loyaltyBalance={loyaltyBalance}
        applyLoyaltyPoints={applyLoyaltyPoints}
        onApplyLoyaltyPointsChange={setApplyLoyaltyPoints}
        useLoyaltyPointsInput={useLoyaltyPointsInput}
        onUseLoyaltyPointsInputChange={setUseLoyaltyPointsInput}
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
