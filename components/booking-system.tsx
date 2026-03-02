'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, CheckCircle2, Star, ShieldCheck, Clock, Calendar, Home, Layers, Sparkles, Wind, ArrowRight, Plus, Minus, Users, CreditCard, Download, RefreshCw, Phone, Mail, MapPin, MessageSquare, Check, AlertCircle, Loader2, Building2, Sofa, ChevronDown, Award, User, X, ThumbsUp, Map, Zap, Tag, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateBookingId } from '@/lib/booking-id';
import { useBookingFormData, type BookingFormData as BookingFormDataFromApi } from '@/lib/useBookingFormData';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import { supabase } from '@/lib/supabase-client';

// --- TYPES ---

type ServiceType = 'standard' | 'deep' | 'move' | 'airbnb' | 'carpet';
type PropertyType = 'apartment' | 'house' | 'office';
type PaymentMethod = 'online' | 'later';
interface Extra {
  id: string;
  label: string;
  price: number;
  icon: React.ReactNode;
}
interface Cleaner {
  id: string;
  name: string;
  photo: string;
  experience: string;
  rating: number;
  reviews: number;
  badge?: string;
  workingAreas: string[];
  unavailableDates: string[];
}
interface Team {
  id: string;
  name: string;
  size: number;
  experience: string;
  availability: 'high' | 'medium' | 'low';
  speciality: string;
  workingAreas: string[];
  unavailableDates: string[];
}
interface BookingFormData {
  service: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  propertyType: PropertyType;
  officeSize: string;
  extras: string[];
  cleanerId: string;
  teamId: string;
  workingArea: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  instructions: string;
  paymentMethod: PaymentMethod;
  tipAmount: number;
  promoCode: string;
  discountAmount: number;
}

// --- CONSTANTS ---

const PROMO_CODES: Record<string, number> = {
  'SHALEAN10': 0.10,
  'SAVE20': 0.20,
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
const INDIVIDUAL_CLEANERS: Cleaner[] = [{
  id: 'c1',
  name: 'Ashley Byrd',
  photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b1e8?auto=format&fit=crop&w=150&q=80',
  experience: '3 years',
  rating: 4.9,
  reviews: 127,
  badge: 'Top Rated',
  workingAreas: ['Sea Point', 'Green Point', 'Camps Bay'],
  unavailableDates: ['2024-05-20', '2024-05-25']
}, {
  id: 'c2',
  name: 'Nomvula Dlamini',
  photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80',
  experience: '5 years',
  rating: 4.8,
  reviews: 214,
  badge: 'Most Booked',
  workingAreas: ['Sea Point', 'Gardens', 'Vredehoek'],
  unavailableDates: ['2024-05-21']
}, {
  id: 'c3',
  name: 'Fatima Hartley',
  photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  experience: '2 years',
  rating: 4.7,
  reviews: 89,
  workingAreas: ['Claremont', 'Kenilworth', 'Rondebosch'],
  unavailableDates: []
}, {
  id: 'c4',
  name: 'Thandiwe Mokoena',
  photo: 'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?auto=format&fit=crop&w=150&q=80',
  experience: '4 years',
  rating: 4.9,
  reviews: 173,
  workingAreas: ['Durbanville', 'Bellville'],
  unavailableDates: []
}];
const TEAMS: Team[] = [{
  id: 't1',
  name: 'Team A — Precision Squad',
  size: 3,
  experience: 'Senior Level',
  availability: 'high',
  speciality: 'Deep & Move-In/Out specialists',
  workingAreas: ['Sea Point', 'Green Point', 'Gardens'],
  unavailableDates: []
}, {
  id: 't2',
  name: 'Team B — Speed Force',
  size: 4,
  experience: 'Expert Level',
  availability: 'medium',
  speciality: 'Large property experts',
  workingAreas: ['Claremont', 'Kenilworth', 'Constantia'],
  unavailableDates: []
}, {
  id: 't3',
  name: 'Team C — Elite Clean',
  size: 2,
  experience: 'Specialist Level',
  availability: 'high',
  speciality: 'Compact & fast turnaround',
  workingAreas: ['Vredehoek', 'Gardens', 'Sea Point'],
  unavailableDates: []
}];
const TIME_SLOTS = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
const WORKING_AREAS = ['Sea Point', 'Green Point', 'Camps Bay', 'Gardens', 'Vredehoek', 'Claremont', 'Kenilworth', 'Rondebosch', 'Durbanville', 'Bellville', 'Constantia'];
const STEP_LABELS = ['Plan', 'Time', 'Crew', 'Final'];
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
  discountAmount: 0
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
const DEFAULT_CITY = 'Cape Town';

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

// --- HELPERS ---

const generateRef = () => 'SHL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
const getQuickDates = () => {
  const today = new Date();
  const currentHour = today.getHours();

  // If it's after 12 PM (12:00), start from tomorrow
  const startDate = new Date(today);
  if (currentHour >= 12) {
    startDate.setDate(today.getDate() + 1);
  }
  const dates: string[] = [];
  let count = 0;
  let i = 0;

  // Find the first 7 valid dates (skipping Sundays)
  while (count < 7) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    if (d.getDay() !== 0) {
      // Skip Sunday
      dates.push(d.toISOString().split('T')[0]);
      count++;
    }
    i++;
  }
  return dates;
};
const getAdvanceMonths = () => {
  const today = new Date();
  const months: {
    label: string;
    value: string;
  }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push({
      label: d.toLocaleDateString('en-ZA', {
        month: 'long',
        year: 'numeric'
      }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    });
  }
  return months;
};
const getDatesForSelectedMonth = (monthValue: string) => {
  if (!monthValue) return [];
  const [year, month] = monthValue.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  const today = new Date();
  const currentHour = today.getHours();
  const todayStr = today.toISOString().split('T')[0];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dateStr = d.toISOString().split('T')[0];

    // Logic: Skip Sundays, and skip today if it's past 12 PM
    const isPastCutoffToday = dateStr === todayStr && currentHour >= 12;
    if (d.getDay() !== 0 && dateStr >= todayStr && !isPastCutoffToday) {
      dates.push(dateStr);
    }
  }
  return dates;
};
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};
const useCalcTotal = (
  data: BookingFormData,
  formData: { pricing: NonNullable<ReturnType<typeof useBookingFormData>['data']>['pricing']; extras?: { prices: Record<string, number> }; equipmentCharge?: number } | null
) => {
  return useMemo(() => {
    const apiService = SERVICE_TO_API[data.service];
    let basePrice = 0;
    let bedroomAdd = 0;
    let bathroomAdd = 0;
    const extraRoomAdd = data.extraRooms * 75;

    if (formData?.pricing?.services?.[apiService]) {
      const s = formData.pricing.services[apiService];
      basePrice = s.base ?? 0;
      bedroomAdd = Math.max(0, data.bedrooms - 1) * (s.bedroom ?? 0);
      bathroomAdd = Math.max(0, data.bathrooms - 1) * (s.bathroom ?? 0);
    } else {
      const svc = SERVICES.find(s => s.id === data.service);
      basePrice = svc?.price ?? 0;
      bedroomAdd = (data.bedrooms - 1) * 100;
      bathroomAdd = (data.bathrooms - 1) * 50;
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

const StepHeader = ({
  title,
  desc,
  step
}: {
  title: string;
  desc: string;
  step: number;
}) => <div className="mb-8">
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-100">
      <Zap className="w-3 h-3" />
      Step {step} of 4
    </div>
    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">{title}</h2>
    <p className="text-slate-500 text-sm max-w-md">{desc}</p>
  </div>;
const FormCard = ({
  selected,
  onClick,
  children,
  className = ""
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) => <button type="button" onClick={onClick} className={`relative w-full text-left group overflow-hidden p-5 rounded-2xl border-2 transition-all duration-300 ${selected ? 'border-blue-600 bg-blue-50/40 shadow-xl shadow-blue-500/10' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50'} ${className}`}>
    <div className={`absolute top-0 right-0 p-2 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-blue-600 rounded-full p-1">
        <Check className="w-3 h-3 text-white" />
      </div>
    </div>
    {children}
  </button>;

// @component: BookingSystem
interface BookingSystemProps {
  onNavigateContact?: () => void;
  initialFormData?: BookingFormDataFromApi | null;
}

export const BookingSystem = ({ onNavigateContact, initialFormData }: BookingSystemProps = {}) => {
  const router = useRouter();
  const { data: formData, loading: formDataLoading, error: formDataError } = useBookingFormData(initialFormData);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [advanceMonth, setAdvanceMonth] = useState('');
  const [showAdvance, setShowAdvance] = useState(false);
  const [session, setSession] = useState<{ user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null>(null);
  const [customerProfile, setCustomerProfile] = useState<{ firstName?: string; lastName?: string; email?: string; phone?: string; rewardsPoints?: number } | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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

  const estimatedDuration = useMemo(() => {
    const selectedService = data.service;
    if (!selectedService) return { label: '—', maxHours: 3 };

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
      hours += Math.max(0, data.bedrooms) * 0.5; // fitted carpets proxy
      hours += Math.max(0, data.bathrooms) * 0.25; // loose carpets/rugs proxy
      hours += Math.max(0, data.extraRooms) * 0.5; // extra crew / complexity
    } else {
      hours += Math.max(0, data.bedrooms) * 0.5;
      hours += Math.max(0, data.bathrooms) * 0.75;
      hours += Math.max(0, data.extraRooms) * 0.5; // extra rooms add to working duration
      if (data.propertyType === 'office') {
        hours += Math.max(0, data.bedrooms) * 0.25; // small office overhead per office
      }
    }

    hours += (data.extras?.length ?? 0) * 0.25;

    const roundHalf = (v: number) => Math.round(v * 2) / 2;
    const base = Math.min(12, Math.max(1.5, roundHalf(hours)));
    const min = Math.max(1, roundHalf(base * 0.9));
    const max = Math.max(min, roundHalf(base * 1.1));
    return { label: `Est. ${min}–${max} hrs`, maxHours: max };
  }, [
    data.service,
    data.bedrooms,
    data.bathrooms,
    data.extraRooms,
    data.extras,
    data.propertyType,
  ]);

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
  const quickDates = useMemo(() => getQuickDates(), []);
  const advanceMonths = useMemo(() => getAdvanceMonths(), []);
  const advanceDates = useMemo(() => getDatesForSelectedMonth(advanceMonth), [advanceMonth]);
  const availableTimeSlots = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (data.date !== todayStr) return TIME_SLOTS;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    return TIME_SLOTS.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      if (h > currentHour) return true;
      if (h === currentHour && m > currentMin) return true;
      return false;
    });
  }, [data.date]);
  const currentExtras = useMemo(() => {
    if (displayExtrasForService?.length) return displayExtrasForService;
    if (data.service === 'standard' || data.service === 'airbnb') {
      return EXTRAS.filter(e => ['fridge', 'oven', 'windows', 'cabinets', 'walls', 'laundry', 'extra_cleaner', 'equipment'].includes(e.id));
    }
    if (data.service === 'deep' || data.service === 'move') {
      return EXTRAS.filter(e => ['balcony', 'carpet_deep', 'ceiling', 'couch', 'garage', 'mattress', 'exterior_windows'].includes(e.id));
    }
    return [];
  }, [data.service, displayExtrasForService]);
  const validateStep = useCallback(() => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    if (step === 1) {
      if (!data.workingArea) newErrors.workingArea = 'Location is required';
      if (data.propertyType === 'office' && !data.officeSize) newErrors.officeSize = 'Size is required';
    }
    if (step === 2) {
      if (!data.date) newErrors.date = 'Date is required';
      if (!data.time) newErrors.time = 'Time is required';
    }
    if (step === 4) {
      if (!data.name.trim()) newErrors.name = 'Required';
      if (!data.email.trim() || !data.email.includes('@')) newErrors.email = 'Valid email required';
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
        address: { line1: data.address.trim(), suburb: data.workingArea || '', city: DEFAULT_CITY },
        cleaner_id: cleanerId || undefined,
        selected_team: selectedTeam,
        requires_team: requiresTeam,
        ...(paymentReference ? { paymentReference } : {}),
        expectedEndTime: expectedEndTime || undefined,
        totalAmount: pricing.total,
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
      const body = buildBookingPayload(paymentReference);
      try {
        const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const result = await res.json();
        if (!result.ok) throw new Error(result.error || 'Failed to submit booking');
        const ref = result.bookingId || paymentReference;
        setBookingRef(ref);
        setStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.push(`/booking/confirmation?ref=${encodeURIComponent(ref)}`);
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : 'Failed to submit booking. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [buildBookingPayload, router]
  );

  const submitGuestBooking = useCallback(async () => {
    setPaymentError('');
    const body = buildBookingPayload(null);
    try {
      const res = await fetch('/api/bookings/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to save booking');
      const ref = result.bookingId || result.id || generateRef();
      setBookingRef(ref);
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      router.push(`/booking/confirmation?ref=${encodeURIComponent(ref)}`);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Failed to save booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [buildBookingPayload, router]);

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === 4) {
      if (data.paymentMethod === 'later') {
        setIsProcessing(true);
        submitGuestBooking();
        return;
      }
      setPaymentError('');
      if (!paystackLoaded) {
        setPaymentError('Payment system is loading. Please wait a moment and try again.');
        return;
      }
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
      if (!paystackKey) {
        setPaymentError('Payment system not configured. Please contact support.');
        return;
      }
      setIsProcessing(true);
      const paymentReference = generateBookingId();
      try {
        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: data.email.trim(),
          amount: Math.round(pricing.total * 100),
          currency: 'ZAR',
          ref: paymentReference,
          metadata: {
            booking_service: data.service,
            customer_email: data.email,
            customer_name: data.name
          },
          onClose: () => setIsProcessing(false),
          callback: () => { submitBooking(paymentReference); }
        });
        handler.openIframe();
      } catch {
        setPaymentError('Failed to open payment. Please try again.');
        setIsProcessing(false);
      }
      return;
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleBack = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const toggleExtra = (id: string) => {
    setData(prev => ({
      ...prev,
      extras: prev.extras.includes(id) ? prev.extras.filter(e => e !== id) : [...prev.extras, id]
    }));
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
      setPromoError('Invalid promo code');
    }
  };
  const filteredCrew = useMemo(() => {
    const needsIndividual = data.service === 'standard' || data.service === 'airbnb';
    if (needsIndividual) {
      return apiCleaners.map((c) => ({
        id: c.id,
        name: c.name,
        photo: c.photo_url ?? '',
        experience: c.years_experience ? `${c.years_experience} years` : 'Experience',
        rating: c.rating ?? 0,
        reviews: 0,
        workingAreas: c.areas ?? [],
        unavailableDates: [],
      }));
    }
    return [{ id: 'assign', name: "We'll assign a team", size: 0, experience: '', availability: 'high' as const, speciality: 'Deep & Move-In/Out specialists', workingAreas: [], unavailableDates: [] }];
  }, [data.service, apiCleaners]);

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

  // @return
  return <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      {/* Dynamic Background Element */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-blue-50 to-transparent -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Shalean</h1>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {STEP_LABELS.map((label, idx) => {
            const isActive = step === idx + 1;
            const isPast = step > idx + 1;
            return <div key={label} className="flex items-center">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : isPast ? 'text-emerald-600 flex items-center gap-1.5' : 'text-slate-400'}`}>
                    {isPast && <Check className="w-3 h-3" />}
                    {label}
                  </div>
                  {idx < STEP_LABELS.length - 1 && <div className="w-4 h-px bg-slate-200 mx-1" />}
                </div>;
          })}
          </div>

          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 text-slate-400">
              <span className="text-xs font-black">STEP {step}/4</span>
            </button>
            {session ? (
              <div className="relative flex items-center gap-2 pl-4 border-l border-slate-200">
                <span className="hidden sm:block text-right">
                  <p className="text-[10px] font-black text-slate-900 leading-none">
                    {customerProfile?.firstName ?? (session.user.user_metadata as any)?.first_name ?? session.user.email?.split('@')[0] ?? 'Account'}
                  </p>
                  <p className="text-[8px] font-bold text-blue-600 uppercase">My account</p>
                </span>
                <button
                  type="button"
                  onClick={() => setShowProfileDropdown((v) => !v)}
                  className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow-sm hover:ring-blue-100 transition-all flex items-center justify-center"
                >
                  {(session.user.user_metadata as any)?.avatar_url ? (
                    <img src={(session.user.user_metadata as any).avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60]"
                    >
                      <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-xs font-black text-slate-900">
                          {[customerProfile?.firstName, customerProfile?.lastName].filter(Boolean).join(' ') || session.user.email}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{session.user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowProfileDropdown(false); router.push('/dashboard'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all text-left"
                      >
                        <Layers className="w-4 h-4" />
                        Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowProfileDropdown(false); setStep(1); setData(DEFAULT_FORM); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all text-left"
                      >
                        <Plus className="w-4 h-4" />
                        New Booking
                      </button>
                      <div className="my-1 border-t border-slate-50" />
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          supabase.auth.signOut().then(() => setSession(null));
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-all text-left"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/login?redirect=/dashboard')}
                  className="hidden sm:block text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
                >
                  My Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/login?redirect=/booking')}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 pb-24 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        <section className="relative">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -10
          }} transition={{
            duration: 0.3
          }}>
              {step === 1 && <div>
                  <StepHeader title="Customize Your Plan" desc="Tell us about your space so we can provide the best cleaning experience." step={1} />
                  
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Choose a Service</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {displayServices.map(s => <FormCard key={s.id} selected={data.service === s.id} onClick={() => setData(p => ({
                      ...p,
                      service: s.id
                    }))}>
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${data.service === s.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {s.icon}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-slate-900">{s.title}</p>
                                <p className="text-xs text-slate-500 leading-snug mt-1">{s.description}</p>
                              </div>
                            </div>
                          </FormCard>)}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Space Details</h3>
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Property Type</label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['apartment', 'house', 'office'] as PropertyType[]).map(type => <button key={type} onClick={() => setData(p => ({
                            ...p,
                            propertyType: type
                          }))} className={`py-3 px-1 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${data.propertyType === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                                  {type}
                                </button>)}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Your Location</label>
                            <div className="relative">
                              <select value={data.workingArea} onChange={e => setData(p => ({
                            ...p,
                            workingArea: e.target.value
                          }))} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm appearance-none focus:border-blue-500 outline-none transition-all">
                                <option value="">Select an area</option>
                                {WORKING_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {errors.workingArea && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">{errors.workingArea}</p>}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-slate-500 uppercase">
                            {data.service === 'carpet' ? 'CARPET DETAILS' : data.propertyType === 'office' ? 'OFFICE CONFIGURATION' : 'ROOMS'}
                          </label>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600">
                                  {data.service === 'carpet' ? <Wind className="w-4 h-4" /> : data.propertyType === 'office' ? <Building2 className="w-4 h-4" /> : <Sofa className="w-4 h-4" />}
                                </div>
                                <span className="font-bold text-sm">
                                  {data.service === 'carpet' ? 'Carpeted Rooms' : data.propertyType === 'office' ? 'Private Offices' : 'Bedrooms'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => setData(p => ({
                              ...p,
                              bedrooms: Math.max(1, p.bedrooms - 1)
                            }))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"><Minus className="w-4 h-4" /></button>
                                <span className="w-6 text-center font-black">{data.bedrooms}</span>
                                <button onClick={() => setData(p => ({
                              ...p,
                              bedrooms: Math.min(15, p.bedrooms + 1)
                            }))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"><Plus className="w-4 h-4" /></button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-600">
                                  {data.service === 'carpet' ? <Layers className="w-4 h-4" /> : data.propertyType === 'office' ? <Wind className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                </div>
                                <span className="font-bold text-sm">
                                  {data.service === 'carpet' ? 'Loose Rugs' : data.propertyType === 'office' ? 'Meeting Rooms' : 'Bathrooms'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => setData(p => ({
                              ...p,
                              bathrooms: Math.max(1, p.bathrooms - 1)
                            }))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"><Minus className="w-4 h-4" /></button>
                                <span className="w-6 text-center font-black">{data.bathrooms}</span>
                                <button onClick={() => setData(p => ({
                              ...p,
                              bathrooms: Math.min(15, p.bathrooms + 1)
                            }))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"><Plus className="w-4 h-4" /></button>
                              </div>
                            </div>

                            {(data.propertyType === 'apartment' || data.propertyType === 'house' || data.service === 'carpet') && <motion.div initial={{
                          opacity: 0,
                          height: 0
                        }} animate={{
                          opacity: 1,
                          height: 'auto'
                        }} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-violet-600">
                                    {data.service === 'carpet' ? <User className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                  </div>
                                  <span className="font-bold text-sm">
                                    {data.service === 'carpet' ? 'Extra cleaner' : 'Extra Rooms'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => setData(p => ({
                              ...p,
                              extraRooms: Math.max(0, p.extraRooms - 1)
                            }))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"><Minus className="w-4 h-4" /></button>
                                  <span className="w-6 text-center font-black">{data.extraRooms}</span>
                                  <button onClick={() => setData(p => ({
                              ...p,
                              extraRooms: Math.min(10, p.extraRooms + 1)
                            }))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"><Plus className="w-4 h-4" /></button>
                                </div>
                              </motion.div>}

                            {data.propertyType === 'office' && <motion.div initial={{
                          opacity: 0,
                          x: 10
                        }} animate={{
                          opacity: 1,
                          x: 0
                        }} className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-500 uppercase mb-3">Office Scale</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {['Small (0-100m²)', 'Medium (100-250m²)', 'Large (250m²+)'].map(size => <button key={size} onClick={() => setData(p => ({
                              ...p,
                              officeSize: size
                            }))} className={`w-full text-center px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${data.officeSize === size ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                                      {size}
                                    </button>)}
                                </div>
                              </motion.div>}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Popular Add-ons</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currentExtras.map(extra => {
                      const active = data.extras.includes(extra.id);
                      return <button key={extra.id} onClick={() => toggleExtra(extra.id)} className={`p-4 rounded-2xl border-2 text-center transition-all ${active ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                              <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3 ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {extra.icon}
                              </div>
                              <p className="text-[10px] font-black text-slate-900 leading-tight mb-1">{extra.label}</p>
                              <p className="text-[10px] font-bold text-blue-600">R{extra.price}</p>
                            </button>;
                    })}
                      </div>
                    </section>
                  </div>
                </div>}

              {step === 2 && <div>
                  <StepHeader title="Select a Schedule" desc="Choose a date and time that works best for you. Flexible reschedules included." step={2} />

                  <div className="space-y-10">
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Availability Calendar</h3>
                        <button onClick={() => setShowAdvance(!showAdvance)} className="text-[10px] font-black text-blue-600 uppercase tracking-tight flex items-center gap-1 hover:text-blue-700 transition-colors">
                          {showAdvance ? 'Show Quick Dates' : 'Select Advance Date'}
                          <Calendar className="w-3 h-3" />
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {!showAdvance ? <motion.div key="quick" initial={{
                      opacity: 0,
                      x: -10
                    }} animate={{
                      opacity: 1,
                      x: 0
                    }} exit={{
                      opacity: 0,
                      x: 10
                    }} className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {quickDates.map(dateStr => {
                        const d = new Date(dateStr + 'T00:00:00');
                        const active = data.date === dateStr;
                        return <button key={dateStr} onClick={() => setData(p => ({
                          ...p,
                          date: dateStr
                        }))} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${active ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-105' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-md'}`}>
                              <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                                {d.toLocaleDateString('en-ZA', {
                              weekday: 'short'
                            })}
                              </span>
                              <span className="text-lg font-black">{d.getDate()}</span>
                              <span className={`text-[8px] font-bold mt-1 ${active ? 'text-blue-200' : 'text-slate-500'}`}>
                                {d.toLocaleDateString('en-ZA', {
                              month: 'short'
                            })}
                              </span>
                            </button>;
                      })}
                          </motion.div> : <motion.div key="advance" initial={{
                      opacity: 0,
                      x: 10
                    }} animate={{
                      opacity: 1,
                      x: 0
                    }} exit={{
                      opacity: 0,
                      x: -10
                    }} className="space-y-4">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {advanceMonths.map(m => <button key={m.value} onClick={() => setAdvanceMonth(m.value)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${advanceMonth === m.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500'}`}>
                                  {m.label}
                                </button>)}
                            </div>
                            
                            {advanceMonth && <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                {advanceDates.map(dateStr => {
                          const d = new Date(dateStr + 'T00:00:00');
                          const active = data.date === dateStr;
                          return <button key={dateStr} onClick={() => setData(p => ({
                            ...p,
                            date: dateStr
                          }))} className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${active ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-slate-50 bg-white hover:border-blue-100'}`}>
                                      <span className={`text-[7px] font-black uppercase ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {d.toLocaleDateString('en-ZA', {
                                weekday: 'short'
                              })}
                                      </span>
                                      <span className="text-sm font-black">{d.getDate()}</span>
                                    </button>;
                        })}
                              </div>}
                          </motion.div>}
                      </AnimatePresence>
                      
                      {errors.date && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">{errors.date}</p>}
                    </section>

                    <section>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Available Slots</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {availableTimeSlots.map(time => <button key={time} onClick={() => setData(p => ({
                      ...p,
                      time
                    }))} className={`py-4 rounded-2xl text-sm font-black transition-all border-2 ${data.time === time ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                            <Clock className="w-3.5 h-3.5 inline mr-2 opacity-50" />
                            {time}
                          </button>)}
                      </div>
                      {errors.time && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">{errors.time}</p>}
                    </section>
                  </div>
                </div>}

              {step === 3 && <div>
                  <StepHeader title="Meet Your Crew" desc="We've curated the best professionals available for your specific needs and location." step={3} />

                  <div className="space-y-6">
                    {cleanersLoading && (data.service === 'standard' || data.service === 'airbnb') ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-slate-500 text-sm">Loading available cleaners...</p>
                      </div>
                    ) : filteredCrew.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCrew.map((person) => {
                          const isTeam = 'size' in person;
                          const selected = isTeam ? data.teamId === person.id : data.cleanerId === person.id;
                          return (
                            <FormCard
                              key={person.id}
                              selected={selected}
                              onClick={() =>
                                setData(p =>
                                  isTeam ? { ...p, teamId: person.id, cleanerId: '' } : { ...p, cleanerId: person.id, teamId: '' }
                                )
                              }
                            >
                              <div className="flex gap-4">
                                {isTeam ? (
                                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Users className="w-8 h-8" />
                                  </div>
                                ) : (
                                  (person as Cleaner).photo ? (
                                    <img src={(person as Cleaner).photo} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt={person.name} />
                                  ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                                      {person.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-black text-slate-900 leading-none">{person.name}</p>
                                    {!isTeam && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        <span className="text-xs font-bold text-slate-700">{(person as Cleaner).rating}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 text-sm max-w-xs mx-auto">
                                    {isTeam ? (person as Team).speciality : `${(person as Cleaner).experience}${(person as Cleaner).reviews ? ` • ${(person as Cleaner).reviews} Reviews` : ''}`}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {isTeam ? (
                                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-full">{(person as Team).availability} Availability</span>
                                    ) : (
                                      (person as Cleaner).badge && (
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-full">{(person as Cleaner).badge}</span>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </FormCard>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">No Crew Found</h4>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">
                          {data.service === 'standard' || data.service === 'airbnb'
                            ? "We couldn't find an available professional for this date and area. Try a different date or location."
                            : "We'll assign a team for your booking."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>}

              {step === 4 && <div>
                  <StepHeader title="Confirm & Secure" desc="Review your booking and enter your details to lock in your professional cleaner." step={4} />
                  {paymentError && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-sm font-bold text-red-700">{paymentError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Information</h4>
                        <div className="space-y-4">
                          {!session && (
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-black text-blue-900">Already a customer?</p>
                                <p className="text-[10px] text-blue-600 font-bold">Sign in to use your saved details</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => router.push('/login?redirect=/booking')}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black"
                              >
                                Login
                              </button>
                            </div>
                          )}
                          <div>
                            <input placeholder="Full Name" value={data.name} onChange={e => setData(p => ({
                          ...p,
                          name: e.target.value
                        }))} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm outline-none transition-all ${errors.name ? 'border-red-200' : 'border-slate-100 focus:border-blue-500'}`} />
                            {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">{errors.name}</p>}
                          </div>
                          <div>
                            <input type="email" placeholder="Email Address" value={data.email} onChange={e => setData(p => ({
                          ...p,
                          email: e.target.value
                        }))} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm outline-none transition-all ${errors.email ? 'border-red-200' : 'border-slate-100 focus:border-blue-500'}`} />
                            {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">{errors.email}</p>}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <input placeholder="Phone" value={data.phone} onChange={e => setData(p => ({
                            ...p,
                            phone: e.target.value
                          }))} className={`w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none transition-all ${errors.phone ? 'border-red-200' : 'focus:border-blue-500'}`} />
                              {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">{errors.phone}</p>}
                            </div>
                            <input placeholder="Unit/Flat #" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all" />
                          </div>
                          <div>
                            <textarea placeholder="Full Street Address" rows={2} value={data.address} onChange={e => setData(p => ({
                          ...p,
                          address: e.target.value
                        }))} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm outline-none resize-none transition-all ${errors.address ? 'border-red-200' : 'border-slate-100 focus:border-blue-500'}`} />
                            {errors.address && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">{errors.address}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Method</h4>
                        <div className="space-y-3">
                          <FormCard selected={data.paymentMethod === 'online'} onClick={() => setData(p => ({ ...p, paymentMethod: 'online' }))}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><CreditCard className="w-5 h-5" /></div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">Pay Online</p>
                                <p className="text-[10px] text-slate-500">Secure card payment now</p>
                              </div>
                            </div>
                          </FormCard>
                          {((customerProfile?.rewardsPoints ?? 0) > 0 && (
                          <FormCard selected={data.paymentMethod === 'later'} onClick={() => setData(p => ({ ...p, paymentMethod: 'later' }))}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600"><Clock className="w-5 h-5" /></div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">Pay on the day of your clean with Shalean Rewards</p>
                                <p className="text-[10px] text-slate-500">Use your rewards balance</p>
                              </div>
                            </div>
                          </FormCard>
                        ))}
                        </div>
                        
                        <div className="pt-4 space-y-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Promotion Code</label>
                          <div className="flex gap-2">
                            <input placeholder="Enter Code" value={promoInput} onChange={e => setPromoInput(e.target.value)} className="flex-1 px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all uppercase font-bold" />
                            <button onClick={handleApplyPromo} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors">
                              Apply
                            </button>
                          </div>
                          {promoError && <p className="text-[10px] text-red-500 font-bold ml-1">{promoError}</p>}
                          {data.promoCode && !promoError && <p className="text-[10px] text-emerald-500 font-bold ml-1 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Code "{data.promoCode}" applied!
                          </p>}
                        </div>

                        <div className="pt-4 space-y-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional Tip</label>
                          <div className="flex gap-2">
                            {[0, 50, 100, 200].map(tip => <button key={tip} onClick={() => setData(p => ({
                          ...p,
                          tipAmount: tip
                        }))} className={`flex-1 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${data.tipAmount === tip ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500'}`}>
                                {tip === 0 ? 'NO TIP' : `R${tip}`}
                              </button>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>}

              {step === 5 && <div className="bg-white rounded-[40px] p-12 text-center shadow-2xl shadow-blue-500/10 border border-slate-100 max-w-2xl mx-auto">
                   <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                     <CheckCircle2 className="w-12 h-12" />
                   </div>
                   <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-none">Booking Confirmed!</h2>
                   <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                     Your cleaning is scheduled for <span className="font-bold text-slate-800">{formatDate(data.date)} at {data.time}</span>.
                   </p>
                   
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-10 flex flex-col items-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reference Number</span>
                     <span className="text-2xl font-black text-blue-600 font-mono tracking-wider">{bookingRef}</span>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button onClick={() => {
                  setStep(1);
                  setData(DEFAULT_FORM);
                }} className="px-8 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                       Book New Session
                     </button>
                     <button
                       type="button"
                       onClick={() => router.push('/dashboard')}
                       className="px-8 py-5 bg-slate-900 text-white font-black rounded-2xl border-2 border-slate-900 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                     >
                       View in Dashboard
                     </button>
                   </div>
                   <div className="mt-4">
                     <button className="w-full px-8 py-5 bg-white text-slate-600 font-black rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                       <Download className="w-5 h-5" />
                       Receipt (PDF)
                     </button>
                   </div>
                   
                   <p className="mt-10 text-[11px] text-slate-400 font-medium">A confirmation email has been sent to <span className="text-slate-900">{data.email}</span></p>
                </div>}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Sidebar: Your Summary only */}
        <aside className="relative">
          <div className="sticky top-32">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl shadow-slate-900/20 overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl transition-all group-hover:bg-blue-500/30" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Summary</span>
                </div>
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">Service Type</p>
                      <p className="text-sm font-black">{displayServices.find(s => s.id === data.service)?.title}</p>
                    </div>
                    <span className="text-sm font-black text-blue-400">R{pricing.basePrice}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">{data.service === 'carpet' ? 'Carpet Details' : 'Scale'}</p>
                      <p className="text-sm font-black">
                        {data.service === 'carpet' ? `${data.bedrooms} Carpets, ${data.bathrooms} Rugs${data.extraRooms > 0 ? `, ${data.extraRooms} Extra Crew` : ''}` : `${data.bedrooms} ${data.propertyType === 'office' ? 'Offices' : 'Bed'}, ${data.bathrooms} ${data.propertyType === 'office' ? 'Rooms' : 'Bath'}`}
                      </p>
                    </div>
                    <span className="text-sm font-black text-blue-400">R{pricing.bedroomAdd + pricing.bathroomAdd + pricing.extraRoomAdd}</span>
                  </div>
                  {data.date && (
                    <div className="flex justify-between items-start pt-2 border-t border-white/5">
                      <div>
                        <p className="text-xs text-slate-400 font-bold mb-1">Scheduled for</p>
                        <p className="text-sm font-black text-emerald-400">{formatDate(data.date)} @ {data.time || 'TBD'}</p>
                        {data.time && expectedEndTime && (
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Working window: {data.time} – {expectedEndTime}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-start pt-2 border-t border-white/5">
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">Estimated duration</p>
                      <p className="text-sm font-black text-slate-200">{estimatedDuration.label}</p>
                    </div>
                  </div>
                  {data.extras.length > 0 && (
                    <div className="flex justify-between items-start pt-2 border-t border-white/5">
                      <div>
                        <p className="text-xs text-slate-400 font-bold mb-1">Extras ({data.extras.length})</p>
                        <p className="text-[10px] text-slate-500 font-bold leading-tight max-w-[120px]">
                          {data.extras.map(e => currentExtras.find(ex => ex.id === e)?.label ?? e).join(', ')}
                        </p>
                      </div>
                      <span className="text-sm font-black text-blue-400">R{pricing.extrasTotal}</span>
                    </div>
                  )}
                  {pricing.tipAmount > 0 && (
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-slate-400 font-bold">Gratuity</p>
                      <span className="text-sm font-black text-blue-400">R{pricing.tipAmount}</span>
                    </div>
                  )}
                </div>
                <div className="pt-8 border-t border-white/10">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">R{pricing.total}</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-3 flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    FULLY INSURED & BONDED SERVICE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {step < 5 && (
        <footer className="fixed bottom-0 left-0 right-0 h-20 z-40 bg-white border-t border-slate-200 flex items-center justify-center">
          <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} disabled={step === 1 || isProcessing} className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all">
                <ChevronLeft className="w-5 h-5" />
                Go Back
              </button>
              <button onClick={handleNext} disabled={isProcessing} className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing…
                  </>
                ) : step === 4 ? (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Finalize Booking
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
            <button type="button" className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-all text-left min-w-0">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0"><MessageSquare className="w-4 h-4" /></div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">WhatsApp Us</p>
                <p className="text-[10px] text-slate-500">Fast response time</p>
              </div>
            </button>
            <button type="button" className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-all text-left min-w-0">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0"><Phone className="w-4 h-4" /></div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">Call Support</p>
                <p className="text-[10px] text-slate-500">+27 21 555 0123</p>
              </div>
            </button>
            {onNavigateContact && (
              <button type="button" onClick={onNavigateContact} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-all text-left min-w-0">
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 flex-shrink-0"><MapPin className="w-4 h-4" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">Contact page</p>
                  <p className="text-[10px] text-slate-500">Get in touch</p>
                </div>
              </button>
            )}
            </div>
          </div>
        </footer>
      )}
    </div>;
};

export default BookingSystem;
