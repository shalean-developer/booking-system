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
import { ShaleanStep1Booking } from '@/components/booking/step1-shalean/shalean-step1-booking';
import { BookingStep2Extras } from '@/components/booking-step2-extras';
import { Step3Review } from '@/components/Step3Review';
import { BookingStep4CheckoutSingle as BookingStep4Confirmation } from '@/components/booking-step4-checkout-single';
import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import type { TeamSelection } from '@/lib/constants/booking-teams';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import { getBookingDurationMinutes } from '@/shared/booking-engine/duration';
import { logBookingFlowClient } from '@/lib/debug-booking-flow';
import type { BookingPriceResult } from '@/lib/pricing';
import type { PricingEngineResult } from '@/lib/pricing-engine';
import type { QuickCleanSettings } from '@/lib/quick-clean-settings';
import { estimateBookingDurationRange } from '@/lib/booking-work-hours';
import { calculateBookingUnified } from '@/lib/pricing/calculateBookingUnified';
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
import type { PricingSnapshot } from '@/lib/pricing/snapshot';
export type { BookingFormData, PropertyType, ServiceType, PricingMode } from '@/components/booking-system-types';

const API_TYPE_TO_SERVICE_ID: Record<string, ServiceType> = {
  'Standard': 'standard',
  'Deep': 'deep',
  'Move In/Out': 'move',
  'Airbnb': 'airbnb',
  'Carpet': 'carpet',
};
/** Legacy deep/move extras ids retained for backward compatibility with persisted sessions. */
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

const STEP_TO_ROUTE: Record<number, string> = {
  1: '/booking',
  2: '/booking/cleaner',
  3: '/booking/review',
  4: '/booking/payment',
};
const ROUTE_TO_STEP: Record<string, number> = {
  booking: 1,
  cleaner: 2,
  review: 3,
  payment: 4,
  plan: 1, // backward compatibility
  time: 2, // backward compatibility
  crew: 3, // backward compatibility
  final: 4, // backward compatibility
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
  const [hasHydrated, setHasHydrated] = useState(false);
  const { data: formData, loading: formDataLoading, error: formDataError } = useBookingFormData(initialFormData);
  const checkoutPricingRef = useRef<{ price_zar: number; total_amount_cents: number } | null>(null);
  const checkoutPricingIntegrityRef = useRef<{
    pricing_hash: string;
    pricing_snapshot: Record<string, unknown> | null;
    pricing_version: string | null;
    pricing_expires_at: string | null;
    pricing_lock_token: string | null;
  } | null>(null);
  const currentStep = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return ROUTE_TO_STEP[last] ?? 1;
  }, [pathname]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { data, setData, lineCalc } = useBooking({
    apiFormData: formData,
    storageKey: BOOKING_STORAGE_KEY,
    initialService,
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
  /** Duplicate slot row already has paystack_ref — do not start a second Paystack session */
  const [unpaidDuplicateHasActivePaystackLink, setUnpaidDuplicateHasActivePaystackLink] = useState(false);
  /** Main Pay blocked after server reports paid / active Pay link (safe retries only) */
  const [checkoutPayBlocked, setCheckoutPayBlocked] = useState(false);
  const [duplicateUnpaidAction, setDuplicateUnpaidAction] = useState<'idle' | 'pay' | 'cancel'>('idle');
  /** Prevents double Pay / duplicate Paystack initialize while async checkout is in flight */
  const paystackCheckoutInFlightRef = useRef(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [confirmedCheckoutTotalZar, setConfirmedCheckoutTotalZar] = useState<number | null>(null);
  const [pricingLockError, setPricingLockError] = useState('');

  /** Checkout is ready only with a persisted server lock (no live recompute on payment step). */
  const checkoutPriceReady = Boolean(
    data.date &&
      data.time &&
      data.workingArea?.trim() &&
      data.pricingSnapshot &&
      data.pricing_snapshot_id &&
      (typeof data.lockedPrice === 'number' ||
        typeof data.pricingSnapshot.result?.finalPrice === 'number'),
  );

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

  useEffect(() => {
    setHasHydrated(true);
  }, []);

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

  /** Live Step 1 preview only — locked totals for steps 2+ come from `data.pricing` (server snapshot). */
  const liveDisplayPricing = useMemo(() => {
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

  const pricingInputRef = useRef<{
    data: BookingFormData;
    lineCalc: BookingPriceResult | null;
    enginePricing: PricingEngineResult | null;
    quickClean: QuickCleanSettings | undefined;
  }>({
    data,
    lineCalc,
    enginePricing,
    quickClean: formData?.quickCleanSettings,
  });
  pricingInputRef.current = {
    data,
    lineCalc,
    enginePricing,
    quickClean: formData?.quickCleanSettings,
  };

  const wizardDisplayPricing = useMemo(
    () => data.pricing ?? liveDisplayPricing,
    [data.pricing, liveDisplayPricing],
  );

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
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      // Fail-safe: do not allow loader to hang forever
      if (!cancelled) {
        controller.abort('cleaners-fetch-timeout');
        setCleanersLoading(false);
      }
    }, 5000);
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
    fetch(`/api/cleaners/available?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { ok?: boolean; cleaners?: ApiCleaner[] }) => {
        if (cancelled) return;
        setApiCleaners(json.ok && Array.isArray(json.cleaners) ? json.cleaners : []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err === 'cleaners-fetch-timeout' || err === 'cleaners-fetch-cleanup') {
          // Expected abort reasons from our own controller.abort(reason) calls.
          return;
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Expected when timeout or effect cleanup aborts in-flight request.
          return;
        }
        console.error('[booking] cleaners fetch failed', err);
        setApiCleaners([]);
      })
      .finally(() => {
        if (!cancelled) {
          window.clearTimeout(timeoutId);
          setCleanersLoading(false);
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort('cleaners-fetch-cleanup');
    };
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
    if (currentStep !== 4) return;
    setData((p) => (p.tipAmount === 0 ? p : { ...p, tipAmount: 0 }));
  }, [currentStep, setData]);

  const validateStep = useCallback((targetStep: number) => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    if (targetStep === 1) {
      if (!data.workingArea?.trim() && !data.address?.trim()) {
        newErrors.workingArea = 'Location is required';
      }
      if (!data.date?.trim()) newErrors.date = 'Date is required';
      if (!data.time?.trim()) newErrors.time = 'Time is required';
      if (!data.service) newErrors.service = 'Please choose a service package';
      if (data.bedrooms < 1) newErrors.bedrooms = 'At least 1 bedroom';
      if (data.bathrooms < 1) newErrors.bathrooms = 'At least 1 bathroom';
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
    if (targetStep === 2) {
      if (!data.service) newErrors.service = 'Service is required';
      if (!data.date) newErrors.date = 'Date is required';
      if (!data.time) newErrors.time = 'Time is required';
    }
    if (targetStep === 3) {
      if (!data.workingArea?.trim() && !data.address?.trim()) {
        newErrors.workingArea = 'Location is required';
      }
      if (!data.cleaner && !data.cleanerId) {
        newErrors.cleanerId = 'Please select a cleaner to continue';
      }
    }
    if (targetStep === 4) {
      if (!data.service || !data.date || !data.time || (!data.workingArea?.trim() && !data.address?.trim()) || (!data.cleaner && !data.cleanerId)) {
        newErrors.service = 'Booking details are incomplete';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data]);

  const buildSnapshotRequestBody = useCallback(
    (overrides?: { date?: string; time?: string }) => {
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
      const dateStr = overrides?.date ?? data.date;
      const timeStr = overrides?.time ?? data.time;
      return {
        date: dateStr,
        time: timeStr,
        service: apiService,
        ...(team_selection ? { team_selection } : {}),
        selected_team: selectedTeam,
        bedrooms: eff.bedrooms,
        bathrooms: eff.bathrooms,
        extraRooms: eff.extraRooms,
        extras: data.extras,
        extrasQuantities,
        frequency: 'one-time' as const,
        tipAmount: data.tipAmount,
        discountAmount: liveDisplayPricing.discountAmount,
        numberOfCleaners: lineCalc?.breakdown.numberOfCleaners ?? 1,
        provideEquipment:
          (data.service === 'standard' || data.service === 'airbnb') &&
          data.scheduleEquipmentPref === 'bring',
        carpetDetails: buildCarpetDetailsForPricing(data),
        pricingEngineFinalCents: liveDisplayPricing.engineFinalCents ?? undefined,
        pricingTotalHours: estimatedDuration.maxHours,
        pricingTeamSize: lineCalc?.breakdown.numberOfCleaners ?? 1,
        equipmentCostCents: companyCostsForEngine?.equipmentCostCents,
        extraCleanerFeeCents: companyCostsForEngine?.extraCleanerFeeCents,
        serviceFee: data.pricingMode === 'basic' ? 0 : liveDisplayPricing.serviceFee,
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
      };
    },
    [
      data,
      liveDisplayPricing.discountAmount,
      liveDisplayPricing.engineFinalCents,
      liveDisplayPricing.serviceFee,
      lineCalc,
      estimatedDuration.maxHours,
      companyCostsForEngine,
      effectiveLoyaltyUsePoints,
      session?.user?.email,
    ],
  );

  const applyCreateSnapshotResponse = useCallback(
    (preview: {
      snapshot?: unknown;
      engine_snapshot?: PricingSnapshot;
      pricing_snapshot_id?: string;
      pricing_hash: string;
      pricing_snapshot?: unknown;
      pricing_version: string;
      pricing_expires_at: string;
      pricing_lock_token: string | null;
      price_zar: number;
      total_amount_cents: number;
    }) => {
      const engine =
        preview.engine_snapshot ??
        (preview.snapshot &&
        typeof preview.snapshot === 'object' &&
        preview.snapshot !== null &&
        'snapshot_json' in (preview.snapshot as object)
          ? (preview.snapshot as { snapshot_json?: { engine?: PricingSnapshot } }).snapshot_json?.engine
          : undefined) ??
        ((preview.snapshot as PricingSnapshot | undefined)?.result ? (preview.snapshot as PricingSnapshot) : undefined);
      if (!engine) {
        throw new Error('Invalid pricing snapshot response');
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
        pricing_version: preview.pricing_version,
        pricing_expires_at: preview.pricing_expires_at,
        pricing_lock_token: preview.pricing_lock_token,
      };
      const pin = pricingInputRef.current;
      let lockedDisplayPricing: WizardDisplayPricing;
      try {
        const computed = computeWizardDisplayPricing({
          data: {
            service: pin.data.service,
            bedrooms: pin.data.bedrooms,
            bathrooms: pin.data.bathrooms,
            extraRooms: pin.data.extraRooms,
            tipAmount: pin.data.tipAmount,
            promoCode: pin.data.promoCode,
            pricingMode: pin.data.pricingMode,
            scheduleEquipmentPref: pin.data.scheduleEquipmentPref,
            extras: pin.data.extras,
            extrasQuantities: pin.data.extrasQuantities,
          },
          lineCalc: pin.lineCalc,
          enginePricing: pin.enginePricing,
          quickCleanSettings: pin.quickClean,
        });
        lockedDisplayPricing = { ...computed, total: preview.price_zar };
      } catch (e) {
        console.warn('[booking] locked pricing display compute failed', e);
        lockedDisplayPricing = {
          tipAmount: pin.data.tipAmount,
          discountAmount: 0,
          subtotal: preview.price_zar,
          total: preview.price_zar,
          serviceFee: 0,
          frequencyDiscount: 0,
          dbPricingRows: [],
          engineFinalCents: null,
          v2Breakdown: null,
          engineMeta: null,
        };
      }
      setData((p) => ({
        ...p,
        pricingSnapshot: engine,
        pricing_snapshot_id: preview.pricing_snapshot_id,
        pricing_hash: preview.pricing_hash,
        pricing_lock_token: preview.pricing_lock_token,
        pricing_expires_at: preview.pricing_expires_at,
        pricing_version: preview.pricing_version,
        lockedPrice: engine.result.finalPrice,
        surgeMultiplier: engine.result.surgeMultiplier,
        priceLockedAt: new Date().toISOString(),
        pricingLoading: false,
        pricing: lockedDisplayPricing,
      }));
      setConfirmedCheckoutTotalZar(engine.result.finalPrice);
    },
    [setData],
  );

  const clearBookingPricingLock = useCallback(() => {
    setData((p) => ({
      ...p,
      pricingSnapshot: null,
      pricing_snapshot_id: undefined,
      pricing_hash: undefined,
      pricing_lock_token: undefined,
      pricing_expires_at: undefined,
      pricing_version: undefined,
      lockedPrice: undefined,
      surgeMultiplier: undefined,
      priceLockedAt: undefined,
      pricingLoading: false,
      pricing: null,
    }));
    checkoutPricingRef.current = null;
    checkoutPricingIntegrityRef.current = null;
    setConfirmedCheckoutTotalZar(null);
  }, [setData]);

  const refreshPricingSnapshot = useCallback(
    async (
      overrides?: { date?: string; time?: string },
      opts?: { showLoading?: boolean },
    ) => {
      const showLoading = opts?.showLoading !== false;
      if (showLoading) setData((p) => ({ ...p, pricingLoading: true }));
      try {
        const body = buildSnapshotRequestBody(overrides);
        const previewRes = await fetch('/api/pricing/create-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const preview = (await previewRes.json()) as {
          ok?: boolean;
          error?: string;
          snapshot?: unknown;
          engine_snapshot?: PricingSnapshot;
          pricing_snapshot_id?: string;
          pricing_hash?: string;
          pricing_snapshot?: unknown;
          pricing_version?: string;
          pricing_expires_at?: string;
          pricing_lock_token?: string | null;
          price_zar?: number;
          total_amount_cents?: number;
        };
        const hasEngine =
          Boolean(preview.engine_snapshot) ||
          (preview.snapshot &&
            typeof preview.snapshot === 'object' &&
            preview.snapshot !== null &&
            ('snapshot_json' in (preview.snapshot as object) || 'result' in (preview.snapshot as object)));
        if (!previewRes.ok || !preview.ok || !hasEngine || preview.price_zar == null) {
          throw new Error(preview.error || 'Could not confirm pricing for this selection.');
        }
        applyCreateSnapshotResponse({
          snapshot: preview.snapshot,
          engine_snapshot: preview.engine_snapshot,
          pricing_snapshot_id: preview.pricing_snapshot_id,
          pricing_hash: String(preview.pricing_hash ?? ''),
          pricing_snapshot: preview.pricing_snapshot,
          pricing_version: String(preview.pricing_version ?? ''),
          pricing_expires_at: String(preview.pricing_expires_at ?? ''),
          pricing_lock_token: preview.pricing_lock_token ?? null,
          price_zar: preview.price_zar,
          total_amount_cents: Number(preview.total_amount_cents) || Math.round(preview.price_zar * 100),
        });
      } catch (e) {
        clearBookingPricingLock();
        throw e;
      }
    },
    [buildSnapshotRequestBody, applyCreateSnapshotResponse, clearBookingPricingLock, setData],
  );

  const handleStep1TimeSlotCommit = useCallback(
    async (slot: { date: string; time: string }) => {
      setPricingLockError('');
      try {
        await refreshPricingSnapshot({ date: slot.date, time: slot.time }, { showLoading: false });
      } catch {
        setPricingLockError('Could not lock this time slot. Please try another time or adjust your details.');
      }
    },
    [refreshPricingSnapshot],
  );

  /** Refresh lock when missing or expired; used right before pending/guest payloads. */
  const ensureCheckoutPricingSnapshot = useCallback(async () => {
    const expiresAt = data.pricing_expires_at;
    const expired =
      expiresAt != null &&
      expiresAt !== '' &&
      !Number.isNaN(new Date(expiresAt).getTime()) &&
      new Date(expiresAt).getTime() < Date.now();
    const hasLock =
      Boolean(checkoutPricingIntegrityRef.current?.pricing_hash) || Boolean(data.pricing_hash);
    if (expired || !hasLock) {
      await refreshPricingSnapshot(undefined, { showLoading: false });
    }
  }, [data.pricing_expires_at, data.pricing_hash, refreshPricingSnapshot]);

  useEffect(() => {
    if (currentStep !== 1) {
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

        const snapRes = await fetch('/api/pricing/create-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildSnapshotRequestBody({ date: chosen.date, time: chosen.time }),
          ),
        });
        const preview = (await snapRes.json().catch(() => null)) as
          | {
              ok?: boolean;
              price_zar?: number;
              engine_snapshot?: PricingSnapshot;
              snapshot?: unknown;
            }
          | null;
        const ok = preview?.ok === true;
        const engine =
          ok && preview?.engine_snapshot
            ? preview.engine_snapshot
            : ok &&
                preview?.snapshot &&
                typeof preview.snapshot === 'object' &&
                preview.snapshot !== null &&
                'snapshot_json' in (preview.snapshot as object)
              ? (preview.snapshot as { snapshot_json?: { engine?: PricingSnapshot } }).snapshot_json?.engine
              : undefined;
        const zar =
          ok && engine && typeof engine.result?.finalPrice === 'number'
            ? engine.result.finalPrice
            : ok && typeof preview?.price_zar === 'number'
              ? preview.price_zar
              : null;
        if (!cancelled) {
          setStep1AuthoritativeTotalZar(zar);
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
    currentStep,
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
    liveDisplayPricing.discountAmount,
    liveDisplayPricing.total,
    liveDisplayPricing.engineFinalCents,
    liveDisplayPricing.serviceFee,
    lineCalc,
    estimatedDuration.maxHours,
    companyCostsForEngine,
    effectiveLoyaltyUsePoints,
    session?.user?.email,
    buildSnapshotRequestBody,
  ]);

  /** Clear server lock when date/time are cleared (no slot selected). */
  useEffect(() => {
    if (data.date && data.time) return;
    setData((p) => {
      if (!p.pricingSnapshot && !p.pricing_snapshot_id) return p;
      return {
        ...p,
        pricingSnapshot: null,
        pricing_snapshot_id: undefined,
        pricing_hash: undefined,
        pricing_lock_token: undefined,
        pricing_expires_at: undefined,
        pricing_version: undefined,
        lockedPrice: undefined,
        surgeMultiplier: undefined,
        priceLockedAt: undefined,
        pricingLoading: false,
        pricing: null,
      };
    });
    checkoutPricingRef.current = null;
    checkoutPricingIntegrityRef.current = null;
    setConfirmedCheckoutTotalZar(null);
  }, [data.date, data.time, setData]);

  /** Schedule step: drop stale lock when date/time no longer match the locked snapshot. */
  useEffect(() => {
    if (currentStep !== 2) return;
    if (!data.pricingSnapshot?.input) return;
    const inp = data.pricingSnapshot.input;
    if (inp.date === data.date && inp.time === data.time) return;
    setData((p) => ({
      ...p,
      pricingSnapshot: null,
      pricing_snapshot_id: undefined,
      pricing_hash: undefined,
      pricing_lock_token: undefined,
      pricing_expires_at: undefined,
      pricing_version: undefined,
      lockedPrice: undefined,
      surgeMultiplier: undefined,
      priceLockedAt: undefined,
      pricingLoading: false,
      pricing: null,
    }));
    checkoutPricingRef.current = null;
    checkoutPricingIntegrityRef.current = null;
    setConfirmedCheckoutTotalZar(null);
  }, [currentStep, data.date, data.time, data.pricingSnapshot, setData]);

  const step4PricingLockOk = Boolean(
    data.date &&
      data.time &&
      data.workingArea?.trim() &&
      data.pricingSnapshot &&
      data.pricing_snapshot_id &&
      (typeof data.lockedPrice === 'number' ||
        typeof data.pricingSnapshot.result?.finalPrice === 'number'),
  );

  useEffect(() => {
    if (currentStep === 2 && (!data.service || !data.date || !data.time)) {
      router.replace('/booking', { scroll: false });
      return;
    }
    if (currentStep === 2 && !data.pricing_snapshot_id) {
      router.replace('/booking', { scroll: false });
      return;
    }
    if (currentStep === 3 && ((!data.workingArea?.trim() && !data.address?.trim()) || (!data.cleaner && !data.cleanerId))) {
      router.replace('/booking/cleaner', { scroll: false });
      return;
    }
    if (currentStep === 3 && !data.pricing_snapshot_id) {
      router.replace('/booking', { scroll: false });
      return;
    }
    if (currentStep === 4 && !step4PricingLockOk) {
      router.replace('/booking/review', { scroll: false });
    }
  }, [
    currentStep,
    data.service,
    data.date,
    data.time,
    data.pricing_snapshot_id,
    data.workingArea,
    data.address,
    data.cleaner,
    data.cleanerId,
    step4PricingLockOk,
    router,
  ]);

  useLayoutEffect(() => {
    if (currentStep !== 4) return;
    if (step4PricingLockOk) return;
    router.replace('/booking/cleaner', { scroll: false });
  }, [currentStep, step4PricingLockOk, data.service, router]);

  const buildBookingPayload = useCallback(
    (paymentReference: string | null) => {
      const totals = checkoutPricingRef.current;
      const integrity = checkoutPricingIntegrityRef.current;
      const pricing_hash = integrity?.pricing_hash ?? data.pricing_hash;
      const pricing_snapshot = integrity?.pricing_snapshot ?? undefined;
      const pricing_version = integrity?.pricing_version ?? data.pricing_version;
      const pricing_expires_at = integrity?.pricing_expires_at ?? data.pricing_expires_at;
      const pricing_lock_token = integrity?.pricing_lock_token ?? data.pricing_lock_token;
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
            total: wizardDisplayPricing.total,
            discountAmount: wizardDisplayPricing.discountAmount,
            serviceFee: data.pricingMode === 'basic' ? 0 : wizardDisplayPricing.serviceFee,
            frequencyDiscount: wizardDisplayPricing.frequencyDiscount,
            engineFinalCents: wizardDisplayPricing.engineFinalCents,
          },
          lineCalc,
          checkoutTotalZar: data.pricingSnapshot!.result.finalPrice,
          estimatedMaxHours: estimatedDuration.maxHours,
          companyCosts: companyCostsForEngine,
          use_points: effectiveLoyaltyUsePoints,
        }
      );
      if (pricing_hash) {
        (payload as unknown as Record<string, unknown>).pricing_hash = pricing_hash;
      }
      if (pricing_snapshot) {
        (payload as unknown as Record<string, unknown>).pricing_snapshot = pricing_snapshot;
      }
      if (pricing_version) {
        (payload as unknown as Record<string, unknown>).pricing_version = pricing_version;
      }
      if (pricing_expires_at) {
        (payload as unknown as Record<string, unknown>).pricing_expires_at = pricing_expires_at;
      }
      if (pricing_lock_token) {
        (payload as unknown as Record<string, unknown>).pricing_lock_token = pricing_lock_token;
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
      wizardDisplayPricing,
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
    | {
        ok: false;
        duplicate: true;
        existingBookingId: string;
        message: string;
        hasActivePaystackLink?: boolean;
        alreadyPaid?: boolean;
      }
    | { ok: false; blocked: true; message: string };

  const runPaystackCheckoutFlow = useCallback(async (allowRetry = true): Promise<PaystackCheckoutResult> => {
    await ensureCheckoutPricingSnapshot();
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
      idempotent?: boolean;
      alreadyPaid?: boolean;
      hasActivePaystackLink?: boolean;
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
        hasActivePaystackLink: pendingJson.hasActivePaystackLink === true,
        alreadyPaid: pendingJson.alreadyPaid === true,
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
        hasActivePaystackLink: pendingJson.hasActivePaystackLink === true,
        alreadyPaid: pendingJson.alreadyPaid === true,
        message:
          pendingJson.error ||
          pendingJson.message ||
          'You already have an unpaid booking for this slot. Pay for it or cancel it, then try again.',
      };
    }
    if (pendingRes.status === 409 && pendingJson.code === 'PRICING_EXPIRED' && allowRetry) {
      await refreshPricingSnapshot(undefined, { showLoading: false });
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
    if (pendingJson.idempotent === true) {
      if (pendingJson.alreadyPaid === true) {
        return { ok: false, blocked: true, message: 'This booking is already paid.' };
      }
      if (pendingJson.hasActivePaystackLink === true) {
        return {
          ok: false,
          blocked: true,
          message:
            'A payment was already started for this booking. Complete checkout in your other tab or open /payment/status. Contact support if you need a new link.',
        };
      }
    }

    const initRes = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    const initData = (await initRes.json()) as {
      authorization_url?: string;
      reference?: string;
      error?: string;
      code?: string;
    };
    if (!initRes.ok || !initData.authorization_url) {
      const code = initData.code;
      if (code === 'ALREADY_PAID') {
        return { ok: false, blocked: true, message: initData.error || 'This booking is already paid.' };
      }
      if (code === 'PAYMENT_LINK_ACTIVE') {
        return {
          ok: false,
          blocked: true,
          message:
            initData.error ||
            'A payment was already started for this booking. Complete checkout or open your payment status page.',
        };
      }
      throw new Error(initData.error || 'Could not start payment.');
    }
    const paystackRef =
      typeof initData.reference === 'string' && initData.reference.trim()
        ? initData.reference.trim()
        : null;
    try {
      if (paystackRef) localStorage.setItem('paystack_last_reference', paystackRef);
      localStorage.setItem('paystack_last_booking_id', bookingId);
    } catch {
      /* ignore */
    }
    return { ok: true, redirectUrl: initData.authorization_url as string };
  }, [buildBookingPayload, ensureCheckoutPricingSnapshot, refreshPricingSnapshot]);

  const payExistingUnpaidBooking = useCallback(async () => {
    if (!unpaidDuplicateBookingId) return;
    if (unpaidDuplicateHasActivePaystackLink) {
      setPaymentError(
        'A payment link is already active for this booking. Complete checkout in your browser or open /payment/status — starting again could cause a duplicate charge.',
      );
      return;
    }
    if (paystackCheckoutInFlightRef.current) {
      setPaymentError('Payment is already starting. Please wait.');
      return;
    }
    paystackCheckoutInFlightRef.current = true;
    setDuplicateUnpaidAction('pay');
    setPaymentError('');
    let navigated = false;
    try {
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: unpaidDuplicateBookingId }),
      });
      const initData = (await initRes.json()) as {
        authorization_url?: string;
        reference?: string;
        error?: string;
        code?: string;
      };
      if (!initRes.ok || !initData.authorization_url) {
        if (initData.code === 'ALREADY_PAID' || initData.code === 'PAYMENT_LINK_ACTIVE') {
          setCheckoutPayBlocked(true);
        }
        throw new Error(initData.error || 'Could not start payment.');
      }
      const paystackRef =
        typeof initData.reference === 'string' && initData.reference.trim()
          ? initData.reference.trim()
          : null;
      try {
        if (paystackRef) localStorage.setItem('paystack_last_reference', paystackRef);
        localStorage.setItem('paystack_last_booking_id', unpaidDuplicateBookingId);
      } catch {
        /* ignore */
      }
      navigated = true;
      window.location.href = initData.authorization_url as string;
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Failed to open payment.');
      setDuplicateUnpaidAction('idle');
    } finally {
      if (!navigated) paystackCheckoutInFlightRef.current = false;
    }
  }, [unpaidDuplicateBookingId, unpaidDuplicateHasActivePaystackLink]);

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
      setUnpaidDuplicateHasActivePaystackLink(false);
      setCheckoutPayBlocked(false);
      setPaymentError('');
      if (paystackCheckoutInFlightRef.current) {
        setPaymentError('Payment is already starting. Please wait.');
        setIsProcessing(false);
        return;
      }
      paystackCheckoutInFlightRef.current = true;
      let checkoutOk = false;
      try {
        const result = await runPaystackCheckoutFlow();
        if (!result.ok) {
          if ('blocked' in result) {
            setCheckoutPayBlocked(true);
            setPaymentError(result.message);
            setIsProcessing(false);
            return;
          }
          setUnpaidDuplicateHasActivePaystackLink(result.hasActivePaystackLink === true);
          if (result.alreadyPaid === true || result.hasActivePaystackLink === true) {
            setCheckoutPayBlocked(true);
          }
          setPaymentError(
            result.alreadyPaid === true
              ? 'This booking is already paid.'
              : result.hasActivePaystackLink === true
                ? `${result.message} If you already paid, open /payment/status to confirm.`
                : result.message,
          );
          setUnpaidDuplicateBookingId(result.existingBookingId);
          setIsProcessing(false);
          return;
        }
        checkoutOk = true;
        window.location.href = result.redirectUrl;
      } finally {
        if (!checkoutOk) paystackCheckoutInFlightRef.current = false;
      }
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
      await ensureCheckoutPricingSnapshot();
      const body = buildBookingPayload(null);
      const res = await fetch('/api/bookings/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to save booking');
      const ref = result.bookingId || result.id || generateRef();
      setIsRedirecting(true);
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
  }, [buildBookingPayload, router, data.date, data.time, ensureCheckoutPricingSnapshot]);

  const startCheckout = useCallback(() => {
    if (!data.pricingSnapshot || !data.pricing_snapshot_id) {
      return;
    }
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
    setUnpaidDuplicateHasActivePaystackLink(false);
    /* Intentionally do not clear checkoutPayBlocked here — avoids retry loops after ALREADY_PAID / PAYMENT_LINK_ACTIVE. */

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
      if (paystackCheckoutInFlightRef.current) {
        setPaymentError('Payment is already starting. Please wait.');
        setIsProcessing(false);
        return;
      }
      paystackCheckoutInFlightRef.current = true;
      let navigated = false;
      try {
        const result = await runPaystackCheckoutFlow();
        if (!result.ok) {
          if ('blocked' in result) {
            setCheckoutPayBlocked(true);
            setPaymentError(result.message);
            setIsProcessing(false);
            return;
          }
          setUnpaidDuplicateHasActivePaystackLink(result.hasActivePaystackLink === true);
          if (result.alreadyPaid === true || result.hasActivePaystackLink === true) {
            setCheckoutPayBlocked(true);
          }
          setPaymentError(
            result.alreadyPaid === true
              ? 'This booking is already paid.'
              : result.hasActivePaystackLink === true
                ? `${result.message} If you already paid, open /payment/status to confirm.`
                : result.message,
          );
          setUnpaidDuplicateBookingId(result.existingBookingId);
          setIsProcessing(false);
          return;
        }
        navigated = true;
        window.location.href = result.redirectUrl;
      } catch (e) {
        setPaymentError(e instanceof Error ? e.message : 'Failed to open payment. Please try again.');
        setIsProcessing(false);
      } finally {
        if (!navigated) paystackCheckoutInFlightRef.current = false;
      }
    })();
  }, [data.paymentMethod, data.pricingSnapshot, data.pricing_snapshot_id, formData?.allowPayLater, submitGuestBooking, runPaystackCheckoutFlow]);

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 1) {
      setPricingLockError('');
      const snapIn = data.pricingSnapshot?.input;
      const alreadyLockedForSlot =
        Boolean(data.pricing_snapshot_id) &&
        snapIn &&
        snapIn.date === data.date &&
        snapIn.time === data.time;
      if (!alreadyLockedForSlot) {
        try {
          await refreshPricingSnapshot(undefined, { showLoading: true });
        } catch {
          setPricingLockError(
            'Could not lock price for your selection. Please check date, time, and home details, then try again.',
          );
          return;
        }
      }
    }
    if (currentStep === 4) {
      startCheckout();
      return;
    }
    if (currentStep === 2 || currentStep === 3) {
      const hasMatchingLock =
        Boolean(data.pricingSnapshot?.result?.finalPrice != null) &&
        data.pricingSnapshot?.input?.date === data.date &&
        data.pricingSnapshot?.input?.time === data.time;
      setPricingLockError('');
      if (!hasMatchingLock) {
        try {
          await refreshPricingSnapshot(undefined, { showLoading: true });
        } catch {
          setPricingLockError(
            currentStep === 2
              ? 'Could not confirm price for this date and time. Please try another slot.'
              : 'Could not confirm price for your selections. Please try again.',
          );
          return;
        }
      }
    }
    const targetStep = Math.min(currentStep + 1, 4);
    const nextRoute = STEP_TO_ROUTE[targetStep] ?? '/booking';
    router.replace(nextRoute, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const subtotal = wizardDisplayPricing.total + wizardDisplayPricing.discountAmount;
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

  const displayTotalFromStep2 = useMemo(() => {
    if (currentStep === 4) {
      if (typeof data.lockedPrice === 'number') return data.lockedPrice;
      if (data.pricingSnapshot?.result?.finalPrice != null) return data.pricingSnapshot.result.finalPrice;
      return confirmedCheckoutTotalZar ?? 0;
    }
    if (currentStep >= 2 && currentStep <= 3) {
      if (typeof data.pricing?.total === 'number') return data.pricing.total;
      if (data.pricingSnapshot?.result?.finalPrice != null) return data.pricingSnapshot.result.finalPrice;
      if (confirmedCheckoutTotalZar != null) return confirmedCheckoutTotalZar;
    }
    return liveDisplayPricing.total;
  }, [
    currentStep,
    data.lockedPrice,
    data.pricing,
    data.pricingSnapshot,
    confirmedCheckoutTotalZar,
    liveDisplayPricing.total,
  ]);

  if (currentStep === 4 && !hasHydrated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="sr-only">Preparing checkout…</span>
      </div>
    );
  }

  if (currentStep === 2) {
    if (!data.service || !data.date || !data.time) {
      router.replace('/booking', { scroll: false });
      return null;
    }
    return (
      <BookingStep2Extras
        data={data}
        setData={setData}
        onContinue={handleNext}
        pricingLockError={pricingLockError}
        pricing={wizardDisplayPricing}
        serviceTitle={displayServices.find((s) => s.id === data.service)?.title ?? 'Cleaning'}
        apiCleaners={apiCleaners}
        cleanersLoading={cleanersLoading}
      />
    );
  }

  if (currentStep === 1) {
    return (
      <ShaleanStep1Booking
        data={data}
        setData={setData}
        apiFormData={formData}
        errors={errors}
        pricingLockError={pricingLockError}
        isPricingLoading={Boolean(data.pricingLoading)}
        onClearPricingLock={clearBookingPricingLock}
        onCommitTimeSlot={handleStep1TimeSlotCommit}
        onContinue={handleNext}
      />
    );
  }

  if (currentStep === 3) {
    return (
      <Step3Review
        data={data}
        serviceTitle={displayServices.find((s) => s.id === data.service)?.title ?? 'Cleaning'}
        pricing={wizardDisplayPricing}
        onGoStep1={() => {
          router.replace('/booking', { scroll: false });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoStep2={() => {
          router.replace('/booking/cleaner', { scroll: false });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoStep4={handleNext}
      />
    );
  }

  if (currentStep === 4 && !step4PricingLockOk) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="sr-only">Preparing checkout…</span>
      </div>
    );
  }

  if (currentStep === 4) {
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
        onFinalize={handleNext}
        isProcessing={isProcessing}
        showLoginCta={!session}
        onLogin={() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('booking_redirect', '/booking/payment');
          }
          router.push('/booking/auth');
        }}
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
        discountAmount={wizardDisplayPricing.discountAmount}
        appliedPromoCode={data.promoCode}
        accountEmail={session?.user?.email ?? null}
        showLoyaltyBlock={showLoyaltyInWizard}
        loyaltyBalance={loyaltyBalance}
        applyLoyaltyPoints={applyLoyaltyPoints}
        onApplyLoyaltyPointsChange={setApplyLoyaltyPoints}
        useLoyaltyPointsInput={useLoyaltyPointsInput}
        onUseLoyaltyPointsInputChange={setUseLoyaltyPointsInput}
        pricingLoading={false}
        checkoutPriceReady={checkoutPriceReady}
        checkoutPayBlocked={checkoutPayBlocked || unpaidDuplicateHasActivePaystackLink}
      />
    );
  }

  if (isRedirecting) {
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
