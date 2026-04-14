'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Star, ShieldCheck, Calendar, Home, Layers, Sparkles, Wind, RefreshCw, Loader2, Building2, Sofa, Award, User } from 'lucide-react';
import { useBookingFormData, type BookingFormData as BookingFormDataFromApi } from '@/lib/useBookingFormData';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import { supabase } from '@/lib/supabase-client';
import { BookingStep1Cleaning } from '@/components/booking-step1-cleaning';
import { BookingStep2Schedule } from '@/components/booking-step2-schedule';
import { BookingStep3Crew } from '@/components/booking-step3-crew';
import { BookingStep4Confirmation } from '@/components/booking-step4-confirmation';
import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import { logBookingFlowClient } from '@/lib/debug-booking-flow';
import { calculateBookingPrice } from '@/lib/pricing';
import {
  aggregateExtraQuantitiesByName,
  buildCarpetDetailsForPricing,
  formServiceToApi,
  getEffectiveRoomCounts,
  slugifyExtraId,
} from '@/lib/booking-pricing-input';
import { BOOKING_FORM_SESSION_KEY } from '@/lib/booking-form-session';

export type { BookingFormData, PropertyType, ServiceType } from '@/components/booking-system-types';

// --- CONSTANTS (promo — validated server-side in `validateBookingDiscountAmount`) ---

const PROMO_CODES: Record<string, number> = {
  SHALEAN10: 0.1,
  SAVE20: 0.2,
  SAVE50: 50,
  NEWCLIENT: 100,
  FIRSTCLEAN: 100,
};
const DEFAULT_FORM: BookingFormData = {
  service: 'standard',
  bedrooms: 2,
  bathrooms: 1,
  extraRooms: 0,
  propertyType: 'apartment',
  officeSize: '',
  extras: [],
  cleanerId: '',
  teamId: '',
  workingArea: '',
  date: '',
  time: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  instructions: '',
  paymentMethod: 'online',
  tipAmount: 0,
  promoCode: '',
  discountAmount: 0,
  officeBoardrooms: 1,
  officePrivateOffices: 1,
  officeOpenAreas: 1,
  officeBathrooms: 1,
  officeKitchens: 1,
  officeHasReception: false,
  carpetRooms: 1,
  carpetRugs: 0,
  carpetExtraCleaner: false,
};

const API_TYPE_TO_SERVICE_ID: Record<string, ServiceType> = {
  'Standard': 'standard',
  'Deep': 'deep',
  'Move In/Out': 'move',
  'Airbnb': 'airbnb',
  'Carpet': 'carpet',
};
const TEAM_ID_TO_NAME: Record<string, 'Team A' | 'Team B' | 'Team C'> = {
  t1: 'Team A',
  t2: 'Team B',
  t3: 'Team C'
};
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const [data, setData] = useState<BookingFormData>(() => {
    const base: BookingFormData = {
      ...DEFAULT_FORM,
      ...(initialService && { service: initialService }),
    };
    if (typeof window === 'undefined') return base;
    try {
      const stored = window.sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // URL service slug is the source of truth for entry points from marketing pages.
        // Ignore stale persisted service when a valid service slug is present.
        if (serviceFromPath) {
          return { ...base, ...parsed, service: serviceFromPath };
        }
        return { ...base, ...parsed };
      }
    } catch {
      // ignore storage errors
    }
    return base;
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

  // Persist booking form data across step route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage write errors
    }
  }, [data]);

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
        allowed = new Set((formData?.extras?.deepAndMove ?? []).map((n) => slugifyExtraId(n)));
      } else {
        allowed = new Set();
      }
      const next = prev.extras.filter((e) => allowed.has(e));
      if (next.length === prev.extras.length) return prev;
      return { ...prev, extras: next };
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
      icon: EXTRA_ICON_MAP[name] ?? <Wind className="w-5 h-5" />,
    }));
    if (data.service === 'standard' || data.service === 'airbnb') {
      return [
        ...fromApi,
        {
          id: 'extra_cleaner',
          label: 'Extra Cleaner',
          price: formData.extras.prices['Extra Cleaner'] ?? 0,
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
      };
    }
    const eff = getEffectiveRoomCounts(data);
    const extrasQuantitiesById: Record<string, number> = {};
    data.extras.forEach((id) => {
      extrasQuantitiesById[id] = (extrasQuantitiesById[id] || 0) + 1;
    });
    const extrasQuantities = aggregateExtraQuantitiesByName(
      data.extras,
      extrasQuantitiesById,
      formData.extras.all
    );
    const calc = calculateBookingPrice(
      formData.pricing,
      {
        service: formServiceToApi(data.service),
        bedrooms: eff.bedrooms,
        bathrooms: eff.bathrooms,
        extraRooms: eff.extraRooms,
        extras: Object.keys(extrasQuantities),
        extrasQuantities,
        carpetDetails: buildCarpetDetailsForPricing(data),
        provideEquipment:
          (data.service === 'standard' || data.service === 'airbnb') &&
          data.scheduleEquipmentPref === 'bring',
        equipmentChargeOverride: formData.equipment?.charge,
        numberOfCleaners: 1,
      },
      'one-time'
    );
    let discountAmount = 0;
    if (data.promoCode) {
      const discount = PROMO_CODES[data.promoCode.toUpperCase()];
      if (discount) {
        discountAmount =
          discount <= 1
            ? Math.round(calc.total * discount)
            : Math.min(calc.total, discount);
      }
    }
    const total = Math.max(0, calc.total - discountAmount) + data.tipAmount;
    const dbPricingRows: { id: string; label: string; value: number }[] = [
      { id: 'base', label: 'Base rate', value: calc.breakdown.base },
    ];
    if (calc.breakdown.bedrooms > 0) {
      dbPricingRows.push({
        id: 'bed',
        label: data.service === 'carpet' ? 'Fitted carpets' : 'Rooms / bedrooms',
        value: calc.breakdown.bedrooms,
      });
    }
    if (calc.breakdown.bathrooms > 0) {
      dbPricingRows.push({
        id: 'bath',
        label: data.service === 'carpet' ? 'Loose rugs / items' : 'Bathrooms',
        value: calc.breakdown.bathrooms,
      });
    }
    if (!['carpet'].includes(data.service) && calc.breakdown.extraRooms > 0) {
      dbPricingRows.push({
        id: 'xroom',
        label: 'Extra rooms',
        value: calc.breakdown.extraRooms,
      });
    }
    if (data.service === 'carpet' && (calc.breakdown.carpetOccupiedFee ?? 0) > 0) {
      dbPricingRows.push({
        id: 'occ',
        label: 'Occupied property',
        value: calc.breakdown.carpetOccupiedFee ?? 0,
      });
    }
    if (calc.breakdown.extrasTotal > 0) {
      dbPricingRows.push({ id: 'extras', label: 'Extras', value: calc.breakdown.extrasTotal });
    }
    if (calc.breakdown.equipmentCharge > 0) {
      dbPricingRows.push({
        id: 'eq',
        label: 'Equipment & supplies',
        value: calc.breakdown.equipmentCharge,
      });
    }
    if (calc.serviceFee > 0) {
      dbPricingRows.push({ id: 'fee', label: 'Service fee', value: calc.serviceFee });
    }
    if (calc.frequencyDiscount > 0) {
      dbPricingRows.push({
        id: 'fdisc',
        label: 'Frequency discount',
        value: -calc.frequencyDiscount,
      });
    }
    return {
      basePrice: calc.breakdown.base,
      bedroomAdd: calc.breakdown.bedrooms,
      bathroomAdd: calc.breakdown.bathrooms,
      extraRoomAdd: calc.breakdown.extraRooms,
      extrasTotal: calc.breakdown.extrasTotal,
      tipAmount: data.tipAmount,
      discountAmount,
      subtotal: calc.subtotal,
      total,
      serviceFee: calc.serviceFee,
      frequencyDiscount: calc.frequencyDiscount,
      dbPricingRows,
    };
  }, [data, formData]);

  const effRoomCounts = useMemo(() => getEffectiveRoomCounts(data), [data]);

  const estimatedDuration = useMemo(() => {
    const selectedService = data.service;
    if (!selectedService) return { label: '—', maxHours: 3 };

    const eff = getEffectiveRoomCounts(data);

    let hours =
      selectedService === 'standard'
        ? 2.0
        : selectedService === 'airbnb'
          ? 2.5
          : selectedService === 'deep'
            ? 4.0
            : selectedService === 'move'
              ? 4.5
              : selectedService === 'carpet'
                ? 2.0
                : 2.5;

    if (selectedService === 'carpet') {
      hours += Math.max(0, eff.bedrooms) * 0.5;
      hours += Math.max(0, eff.bathrooms) * 0.25;
      hours += Math.max(0, eff.extraRooms) * 0.5;
    } else {
      hours += Math.max(0, eff.bedrooms) * 0.5;
      hours += Math.max(0, eff.bathrooms) * 0.75;
      hours += Math.max(0, eff.extraRooms) * 0.5;
      if (data.propertyType === 'office') {
        hours += Math.max(0, eff.bedrooms) * 0.25;
      }
    }

    hours += (data.extras?.length ?? 0) * 0.25;

    const roundHalf = (v: number) => Math.round(v * 2) / 2;
    const base = Math.min(12, Math.max(1.5, roundHalf(hours)));
    const min = Math.max(1, roundHalf(base * 0.9));
    const max = Math.max(min, roundHalf(base * 1.1));
    return { label: `Est. ${min}–${max} hrs`, maxHours: max };
  }, [data]);

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
    const city = data.workingArea;
    let cancelled = false;
    setCleanersLoading(true);
    const params = new URLSearchParams({
      date: data.date,
      city,
      suburb: city,
    });
    if (data.time) params.set('time', data.time);
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
  }, [data.date, data.workingArea, data.time]);

  const currentExtras = useMemo(() => {
    if (displayExtrasForService?.length) return displayExtrasForService;
    return [];
  }, [displayExtrasForService]);

  const crewDisplayName = useMemo(() => {
    if (data.teamId) {
      const teams: Record<string, string> = { t1: 'Team Alpha', t2: 'Team Bravo', t3: 'Team Sierra' };
      return teams[data.teamId] ?? 'Team';
    }
    const c = apiCleaners.find((x) => x.id === data.cleanerId);
    return c?.name ?? 'Your cleaner';
  }, [data.teamId, data.cleanerId, apiCleaners]);

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
    const labels = data.extras.map((e) => currentExtras.find((ex) => ex.id === e)?.label ?? e);
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
  }, [data.extras, data.service, data.scheduleEquipmentPref, currentExtras, pricing.extrasTotal, formData?.equipment?.charge]);

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
    const selectedTeam =
      data.teamId && TEAM_ID_TO_NAME[data.teamId] ? TEAM_ID_TO_NAME[data.teamId] : undefined;
    const eff = getEffectiveRoomCounts(data);
    const extrasQuantities: Record<string, number> = {};
    data.extras.forEach((id) => {
      extrasQuantities[id] = (extrasQuantities[id] || 0) + 1;
    });
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
        numberOfCleaners: 1,
        provideEquipment:
          (data.service === 'standard' || data.service === 'airbnb') &&
          data.scheduleEquipmentPref === 'bring',
        carpetDetails: buildCarpetDetailsForPricing(data),
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
  }, [data, pricing.total, pricing.discountAmount]);

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
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const apiService = formServiceToApi(data.service);
      const requiresTeam = data.service === 'deep' || data.service === 'move';
      const cleanerId = data.cleanerId && UUID_REGEX.test(data.cleanerId) ? data.cleanerId : null;
      const selectedTeam = data.teamId && TEAM_ID_TO_NAME[data.teamId] ? TEAM_ID_TO_NAME[data.teamId] : undefined;
      const extrasQuantities: Record<string, number> = {};
      data.extras.forEach((id) => {
        extrasQuantities[id] = (extrasQuantities[id] || 0) + 1;
      });
      const eff = getEffectiveRoomCounts(data);
      const totals = checkoutPricingRef.current;
      const totalAmount = totals?.finalTotal ?? pricing.total;
      const preSurgeTotal = totals?.preSurgeTotal ?? pricing.total;
      return {
        step: 4 as const,
        service: apiService,
        bedrooms: eff.bedrooms,
        bathrooms: eff.bathrooms,
        extraRooms: eff.extraRooms,
        numberOfCleaners: 1,
        extras: data.extras,
        extrasQuantities,
        carpetDetails: buildCarpetDetailsForPricing(data),
        provideEquipment:
          (data.service === 'standard' || data.service === 'airbnb') &&
          data.scheduleEquipmentPref === 'bring',
        notes: data.instructions || '',
        date: data.date,
        time: data.time,
        frequency: 'one-time' as const,
        firstName,
        lastName,
        email: data.email.trim(),
        phone: data.phone.trim(),
        address: { line1: data.address.trim(), suburb: data.workingArea || '', city: BOOKING_DEFAULT_CITY },
        cleaner_id: cleanerId || undefined,
        selected_team: selectedTeam,
        requires_team: requiresTeam,
        ...(paymentReference ? { paymentReference } : {}),
        expectedEndTime: expectedEndTime || undefined,
        totalAmount,
        preSurgeTotal,
        serviceFee: pricing.serviceFee,
        frequencyDiscount: pricing.frequencyDiscount,
        discountCode: data.promoCode || undefined,
        discountAmount: pricing.discountAmount,
        tipAmount: data.tipAmount,
      };
    },
    [data, pricing, expectedEndTime]
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
    if (PROMO_CODES[code]) {
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
            ? (displayExtrasForService ?? undefined)
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
