'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Star, ShieldCheck, Calendar, Home, Layers, Sparkles, Wind, RefreshCw, Loader2, Building2, Sofa, Award, User } from 'lucide-react';
import { generateBookingId } from '@/lib/booking-id';
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

export type { BookingFormData, PropertyType, ServiceType } from '@/components/booking-system-types';

// --- TYPES ---

interface Extra {
  id: string;
  label: string;
  price: number;
  icon: React.ReactNode;
}
// --- CONSTANTS ---

const PROMO_CODES: Record<string, number> = {
  'SHALEAN10': 0.10,
  'SAVE20': 0.20,
  'SAVE50': 50,
  'NEWCLIENT': 100,
  'FIRSTCLEAN': 100
};
const SERVICES = [{
  id: 'standard' as ServiceType,
  title: 'Standard Clean',
  description: 'Perfect for regular maintenance of your home.',
  price: 450,
  icon: <Sparkles className="w-6 h-6" />,
  color: 'blue'
}, {
  id: 'deep' as ServiceType,
  title: 'Deep Clean',
  description: 'Intensive cleaning for seasonal or first-time visits.',
  price: 850,
  icon: <Layers className="w-6 h-6" />,
  color: 'indigo'
}, {
  id: 'move' as ServiceType,
  title: 'Move In / Out',
  description: 'Full sanitization for moving into or out of a home.',
  price: 1200,
  icon: <Home className="w-6 h-6" />,
  color: 'violet'
}, {
  id: 'airbnb' as ServiceType,
  title: 'Airbnb Turn',
  description: 'Rapid, hotel-standard turnover for your guests.',
  price: 650,
  icon: <Calendar className="w-6 h-6" />,
  color: 'sky'
}, {
  id: 'carpet' as ServiceType,
  title: 'Carpet Clean',
  description: 'Steam cleaning and stain removal for all carpets.',
  price: 350,
  icon: <Wind className="w-6 h-6" />,
  color: 'teal'
}] as any[];
const EXTRAS: Extra[] = [{
  id: 'fridge',
  label: 'Inside Fridge',
  price: 150,
  icon: <Wind className="w-5 h-5" />
}, {
  id: 'oven',
  label: 'Inside Oven',
  price: 150,
  icon: <Sparkles className="w-5 h-5" />
}, {
  id: 'windows',
  label: 'Interior Windows',
  price: 200,
  icon: <Layers className="w-5 h-5" />
}, {
  id: 'cabinets',
  label: 'Inside Cabinets',
  price: 180,
  icon: <Home className="w-5 h-5" />
}, {
  id: 'walls',
  label: 'Wall Spot Clean',
  price: 120,
  icon: <ShieldCheck className="w-5 h-5" />
}, {
  id: 'water_plants',
  label: 'Water Plants',
  price: 20,
  icon: <Sparkles className="w-5 h-5" />
}, {
  id: 'ironing',
  label: 'Ironing',
  price: 40,
  icon: <User className="w-5 h-5" />
}, {
  id: 'flatlet',
  label: 'Small Flatlet',
  price: 95,
  icon: <Building2 className="w-5 h-5" />
}, {
  id: 'laundry',
  label: 'Laundry Wash',
  price: 250,
  icon: <RefreshCw className="w-5 h-5" />
}, {
  id: 'extra_cleaner',
  label: 'Extra Cleaner',
  price: 350,
  icon: <User className="w-5 h-5" />
}, {
  id: 'equipment',
  label: 'Supplies Kit',
  price: 200,
  icon: <Award className="w-5 h-5" />
}, {
  id: 'balcony',
  label: 'Balcony Cleaning',
  price: 300,
  icon: <Home className="w-5 h-5" />
}, {
  id: 'carpet_deep',
  label: 'Carpet Cleaning',
  price: 450,
  icon: <Wind className="w-5 h-5" />
}, {
  id: 'ceiling',
  label: 'Ceiling Cleaning',
  price: 400,
  icon: <Layers className="w-5 h-5" />
}, {
  id: 'couch',
  label: 'Couch Cleaning',
  price: 350,
  icon: <Sofa className="w-5 h-5" />
}, {
  id: 'garage',
  label: 'Garage Cleaning',
  price: 500,
  icon: <Building2 className="w-5 h-5" />
}, {
  id: 'mattress',
  label: 'Mattress Cleaning',
  price: 300,
  icon: <Sparkles className="w-5 h-5" />
}, {
  id: 'exterior_windows',
  label: 'Exterior Windows',
  price: 350,
  icon: <Layers className="w-5 h-5" />
}];
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

// Map our service id to API ServiceType
const SERVICE_TO_API: Record<ServiceType, 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb' | 'Carpet'> = {
  standard: 'Standard',
  deep: 'Deep',
  move: 'Move In/Out',
  airbnb: 'Airbnb',
  carpet: 'Carpet'
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
function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
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
const BOOKING_STORAGE_KEY = 'shalean-booking-form-v1';

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

/** Maps step-1 UI (office/carpet/studio) into bedroom/bathroom/extra counts for API pricing */
function getEffectiveRoomCounts(data: BookingFormData): { bedrooms: number; bathrooms: number; extraRooms: number } {
  if (data.service === 'carpet') {
    return {
      bedrooms: data.carpetRooms ?? data.bedrooms,
      bathrooms: data.carpetRugs ?? data.bathrooms,
      extraRooms: data.carpetExtraCleaner ? 1 : 0,
    };
  }
  if (data.propertyType === 'office') {
    const ob = data.officeBoardrooms ?? data.bathrooms;
    const op = data.officePrivateOffices ?? data.bedrooms;
    const ox =
      (data.officeOpenAreas ?? 0) +
      (data.officeKitchens ?? 0) +
      (data.officeBathrooms ?? 0) +
      (data.officeHasReception ? 1 : 0);
    return { bedrooms: op, bathrooms: ob, extraRooms: ox };
  }
  if (data.propertyType === 'studio') {
    return {
      bedrooms: 0,
      bathrooms: Math.max(1, data.bathrooms),
      extraRooms: data.extraRooms,
    };
  }
  return { bedrooms: data.bedrooms, bathrooms: data.bathrooms, extraRooms: data.extraRooms };
}

const useCalcTotal = (
  data: BookingFormData,
  formData: { pricing: NonNullable<ReturnType<typeof useBookingFormData>['data']>['pricing']; extras?: { prices: Record<string, number> }; equipmentCharge?: number } | null
) => {
  return useMemo(() => {
    const apiService = SERVICE_TO_API[data.service];
    const eff = getEffectiveRoomCounts(data);
    let basePrice = 0;
    let bedroomAdd = 0;
    let bathroomAdd = 0;
    const extraRoomAdd = eff.extraRooms * 75;

    if (formData?.pricing?.services?.[apiService]) {
      const s = formData.pricing.services[apiService];
      basePrice = s.base ?? 0;
      bedroomAdd = Math.max(0, eff.bedrooms - 1) * (s.bedroom ?? 0);
      bathroomAdd = Math.max(0, eff.bathrooms - 1) * (s.bathroom ?? 0);
    } else {
      const svc = SERVICES.find(s => s.id === data.service);
      basePrice = svc?.price ?? 0;
      bedroomAdd = (eff.bedrooms - 1) * 100;
      bathroomAdd = (eff.bathrooms - 1) * 50;
    }

    let extrasTotal = 0;
    if (formData?.extras?.prices || formData?.equipmentCharge !== undefined) {
      for (const id of data.extras) {
        if (id === 'extra_cleaner') {
          extrasTotal += formData.extras?.prices?.['Extra Cleaner'] ?? 350;
        } else if (id === 'equipment') {
          extrasTotal += formData.equipmentCharge ?? 500;
        } else {
          const price = (formData.extras?.prices && Object.entries(formData.extras.prices).find(([name]) => slugify(name) === id)?.[1]) ?? formData.extras?.prices?.[id];
          extrasTotal += price ?? 0;
        }
      }
    } else {
      for (const id of data.extras) {
        const e = EXTRAS.find(ex => ex.id === id);
        extrasTotal += e?.price ?? 0;
      }
    }

    const tipAmount = data.tipAmount;
    const subtotal = basePrice + bedroomAdd + bathroomAdd + extraRoomAdd + extrasTotal;
    let discountAmount = 0;
    if (data.promoCode) {
      const discount = PROMO_CODES[data.promoCode.toUpperCase()];
      if (discount) {
        discountAmount = discount <= 1 ? Math.round(subtotal * discount) : Math.min(subtotal, discount);
      }
    }
    return {
      basePrice,
      bedroomAdd,
      bathroomAdd,
      extraRoomAdd,
      extrasTotal,
      tipAmount,
      discountAmount,
      subtotal,
      total: Math.max(0, subtotal - discountAmount) + tipAmount
    };
  }, [data, formData]);
};

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
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
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

  // Drop extras that do not apply to the selected service (ids must stay in sync with step-2 grid)
  useEffect(() => {
    const standardAirbnb = new Set([
      'fridge',
      'oven',
      'cabinets',
      'windows',
      'walls',
      'water_plants',
      'ironing',
      'laundry',
      'flatlet',
      'equipment',
      'extra_cleaner',
    ]);
    const deepMove = new Set(['carpet_deep', 'ceiling', 'garage', 'balcony', 'couch', 'exterior_windows']);
    setData((prev) => {
      const allowed =
        prev.service === 'standard' || prev.service === 'airbnb'
          ? standardAirbnb
          : prev.service === 'deep' || prev.service === 'move'
            ? deepMove
            : new Set<string>();
      const next = prev.extras.filter((e) => allowed.has(e));
      if (next.length === prev.extras.length) return prev;
      return { ...prev, extras: next };
    });
  }, [data.service]);

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
          const price = formData.pricing?.services?.[s.type]?.base ?? SERVICES.find((x) => x.id === id)?.price ?? 0;
          return { id, title: s.label, description: s.description || s.subLabel, icon, price, color: 'blue' as const };
        })
        .filter(Boolean) as { id: ServiceType; title: string; description: string; icon: React.ReactNode; price: number; color: string }[];
    }
    return SERVICES.map((s) => ({ id: s.id, title: s.title, description: s.description, icon: s.icon, price: s.price, color: s.color }));
  }, [formData]);

  const displayExtrasForService = useMemo(() => {
    if (!formData?.extras) return null;
    const list = data.service === 'standard' || data.service === 'airbnb'
      ? formData.extras.standardAndAirbnb
      : data.service === 'deep' || data.service === 'move'
        ? formData.extras.deepAndMove
        : [];
    const fromApi = list.map((name) => ({
      id: slugify(name),
      label: name,
      price: formData.extras.prices[name] ?? 0,
      icon: EXTRA_ICON_MAP[name] ?? <Wind className="w-5 h-5" />,
    }));
    if (data.service === 'standard' || data.service === 'airbnb') {
      return [
        ...fromApi,
        { id: 'extra_cleaner', label: 'Extra Cleaner', price: formData.extras.prices['Extra Cleaner'] ?? 350, icon: EXTRA_ICON_MAP['Extra Cleaner'] ?? <User className="w-5 h-5" /> },
        { id: 'equipment', label: 'Supplies Kit', price: formData.equipment?.charge ?? 500, icon: EXTRA_ICON_MAP['Supplies Kit'] ?? <Award className="w-5 h-5" /> },
      ];
    }
    return fromApi;
  }, [formData, data.service]);

  const pricing = useCalcTotal(data, formData ? { pricing: formData.pricing, extras: formData?.extras, equipmentCharge: formData?.equipment?.charge } : null);

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
    fetch(`/api/cleaners/available?date=${encodeURIComponent(data.date)}&city=${encodeURIComponent(city)}`)
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
  }, [data.date, data.workingArea]);

  // Load Paystack inline script (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).PaystackPop) {
      setPaystackLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    script.onerror = () => console.error('Failed to load Paystack script');
    document.body.appendChild(script);
    return () => {
      const existing = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
      if (existing?.parentNode) existing.parentNode.removeChild(existing);
    };
  }, []);
  const currentExtras = useMemo(() => {
    if (displayExtrasForService?.length) return displayExtrasForService;
    if (data.service === 'standard' || data.service === 'airbnb') {
      return EXTRAS.filter(e => ['fridge', 'oven', 'windows', 'cabinets', 'walls', 'laundry', 'extra_cleaner', 'equipment', 'water_plants', 'ironing', 'flatlet'].includes(e.id));
    }
    if (data.service === 'deep' || data.service === 'move') {
      return EXTRAS.filter(e => ['balcony', 'carpet_deep', 'ceiling', 'couch', 'garage', 'mattress', 'exterior_windows'].includes(e.id));
    }
    return [];
  }, [data.service, displayExtrasForService]);

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
    const zar = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(pricing.extrasTotal);
    return `${labels.join(' + ')} (+${zar})`;
  }, [data.extras, currentExtras, pricing.extrasTotal]);

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

  const buildBookingPayload = useCallback(
    (paymentReference: string | null) => {
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const apiService = SERVICE_TO_API[data.service];
      const requiresTeam = data.service === 'deep' || data.service === 'move';
      const cleanerId = data.cleanerId && UUID_REGEX.test(data.cleanerId) ? data.cleanerId : null;
      const selectedTeam = data.teamId && TEAM_ID_TO_NAME[data.teamId] ? TEAM_ID_TO_NAME[data.teamId] : undefined;
      const extrasQuantities: Record<string, number> = {};
      data.extras.forEach((id) => {
        extrasQuantities[id] = (extrasQuantities[id] || 0) + 1;
      });
      const totals = checkoutPricingRef.current;
      const totalAmount = totals?.finalTotal ?? pricing.total;
      const preSurgeTotal = totals?.preSurgeTotal ?? pricing.total;
      return {
        step: 4 as const,
        service: apiService,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        numberOfCleaners: 1,
        extras: data.extras,
        extrasQuantities,
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
        serviceFee: 0,
        frequencyDiscount: 0,
        discountCode: data.promoCode || undefined,
        discountAmount: pricing.discountAmount,
        tipAmount: data.tipAmount,
      };
    },
    [data, pricing.total, pricing.discountAmount, expectedEndTime]
  );

  const submitBooking = useCallback(
    async (paymentReference: string) => {
      setPaymentError('');
      if (!data.date || !data.time) {
        setPaymentError('Please select a date and time before confirming your booking.');
        setIsProcessing(false);
        return;
      }
      const body = buildBookingPayload(paymentReference);
      try {
        const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const result = await res.json();
        if (!result.ok) {
          // Prefer detailed message from API if available
          const errorMessage = result.error || result.message || 'Failed to submit booking';
          throw new Error(errorMessage);
        }
        const ref = result.bookingId || paymentReference;
        setStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const ct =
          typeof result.confirmationToken === 'string' && result.confirmationToken
            ? `&ct=${encodeURIComponent(result.confirmationToken)}`
            : '';
        const confirmPath = `/booking/confirmation?ref=${encodeURIComponent(ref)}${ct}`;
        logBookingFlowClient('POST /api/bookings succeeded → redirect', {
          ref,
          hasConfirmationToken: Boolean(ct),
          path: confirmPath,
        });
        router.push(confirmPath);
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : 'Failed to submit booking. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [buildBookingPayload, router, data.date, data.time]
  );

  const submitGuestBooking = useCallback(async () => {
    setPaymentError('');
    if (!data.date || !data.time) {
      setPaymentError('Please select a date and time before confirming your booking.');
      setIsProcessing(false);
      return;
    }
    try {
      const apiService = SERVICE_TO_API[data.service];
      const selectedTeam =
        data.teamId && TEAM_ID_TO_NAME[data.teamId] ? TEAM_ID_TO_NAME[data.teamId] : undefined;
      const previewRes = await fetch('/api/booking/pricing-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: data.date,
          service: apiService,
          preSurgeTotal: pricing.total,
          selected_team: selectedTeam,
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
  }, [buildBookingPayload, router, data.date, data.time, data.service, data.teamId, pricing.total]);

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

      if (!paystackLoaded) {
        setPaymentError('Payment system is loading. Please wait a moment and try again.');
        return;
      }
      if (!paystackKey) {
        setPaymentError(
          'Payment system is not configured. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your environment (see .env.example) or contact support.'
        );
        return;
      }
      setIsProcessing(true);
      const paymentReference = generateBookingId();
      void (async () => {
        try {
          const apiService = SERVICE_TO_API[data.service];
          const selectedTeam =
            data.teamId && TEAM_ID_TO_NAME[data.teamId] ? TEAM_ID_TO_NAME[data.teamId] : undefined;
          const previewRes = await fetch('/api/booking/pricing-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: data.date,
              service: apiService,
              preSurgeTotal: pricing.total,
              selected_team: selectedTeam,
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
          const handler = (window as any).PaystackPop.setup({
            key: paystackKey,
            email: data.email.trim(),
            amount: Math.round(preview.finalTotalZar * 100),
            currency: 'ZAR',
            ref: paymentReference,
            metadata: {
              booking_service: data.service,
              customer_email: data.email,
              customer_name: data.name,
            },
            onClose: () => setIsProcessing(false),
            callback: () => {
              submitBooking(paymentReference);
            },
          });
          handler.openIframe();
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
        totalZar={pricing.total}
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
