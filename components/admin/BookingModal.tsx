'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  CreditCard,
  Mail,
  User,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcTotalAsync, generateTimeSlots, type BookingPriceResult } from '@/lib/pricing';
import type { ServiceType } from '@/types/booking';
import type { BookingFormDataServer } from '@/lib/booking-form-data-server';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingFormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  suburb: string;
  city: string;
  /** Matches `ServiceType` from DB-backed booking form */
  serviceType: ServiceType | '';
  date: string;
  /** HH:MM (24h), same as `/api/admin/bookings` */
  time: string;
  cleanerId: string;
  notes: string;
  bedrooms: string;
  bathrooms: string;
  /** Extra labels matching `pricing_config` / `calcTotalAsync` */
  selectedExtras: string[];
}

export type BookingSuccessPayload = BookingFormData & {
  id: string;
  amount: number;
  cleanerLabel?: string;
  serviceLabel?: string;
  /** True when booking exists but user still needs to complete Paystack */
  paymentPending?: boolean;
};

interface CleanerOption {
  id: string;
  name: string;
  initials: string;
  rating: number;
  jobs: number;
  color: string;
  available: boolean;
}

const STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Schedule' },
  { id: 4, label: 'Payment' },
];

const EMPTY_FORM: BookingFormData = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  address: '',
  suburb: '',
  city: 'Cape Town',
  serviceType: '',
  date: '',
  time: '',
  cleanerId: '',
  notes: '',
  bedrooms: '2',
  bathrooms: '1',
  selectedExtras: [],
};

const SERVICE_CARD_COLORS = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];

function serviceRequiresTeam(st: ServiceType | ''): boolean {
  return st === 'Deep' || st === 'Move In/Out';
}

function extrasForService(
  st: ServiceType | '',
  extras: BookingFormDataServer['extras'] | null
): string[] {
  if (!st || !extras) return [];
  if (st === 'Standard' || st === 'Airbnb') return extras.standardAndAirbnb;
  if (st === 'Deep' || st === 'Move In/Out') return extras.deepAndMove;
  if (st === 'Carpet') return extras.all;
  return extras.all;
}

function parseRoomCount(raw: string): number {
  const n = parseInt(String(raw).replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) return 1;
  return Math.min(n, 20);
}

function formatTimeSlotLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  if (!Number.isFinite(h)) return hhmm;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString('en-ZA', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── BookingModal ─────────────────────────────────────────────────────────────

export const BookingModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: BookingSuccessPayload) => void;
}) => {
  const [step, setStep] = useState(1);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState<BookingFormDataServer | null>(null);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [cleanerRows, setCleanerRows] = useState<Record<string, unknown>[]>([]);
  const [loadingCleaners, setLoadingCleaners] = useState(false);
  const [form, setForm] = useState<BookingFormData>(EMPTY_FORM);
  const [pricing, setPricing] = useState<BookingPriceResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Set after a successful POST so a Paystack retry does not create a second booking */
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingFormData(true);
    fetch('/api/booking/form-data')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.ok && data.services) {
          setFormData({
            services: data.services,
            pricing: data.pricing ?? null,
            extras: data.extras,
            equipment: data.equipment ?? { items: [], charge: 0 },
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingFormData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingCleaners(true);
    fetch('/api/admin/cleaners?limit=80&offset=0&active=true', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.ok && Array.isArray(data.cleaners)) {
          setCleanerRows(data.cleaners);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCleaners(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const cleanerOptions: CleanerOption[] = useMemo(() => {
    return cleanerRows.map((c, i) => {
      const name = String(c.name ?? 'Cleaner');
      const initials = name
        .trim()
        .split(/\s+/)
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';
      return {
        id: String(c.id),
        name,
        initials,
        rating: (Number(c.average_rating ?? c.rating) || 0),
        jobs: (Number(c.completed_bookings ?? c.total_bookings) || 0),
        color: SERVICE_CARD_COLORS[i % SERVICE_CARD_COLORS.length],
        available: c.is_active !== false,
      };
    });
  }, [cleanerRows]);

  const sortedServices = useMemo(() => {
    if (!formData?.services?.length) return [];
    return [...formData.services].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [formData]);

  const selectedServiceMeta = sortedServices.find((s) => s.type === form.serviceType);
  const selectedCleaner = cleanerOptions.find((c) => c.id === form.cleanerId);

  const allowedExtras = useMemo(
    () => extrasForService(form.serviceType, formData?.extras ?? null),
    [form.serviceType, formData]
  );

  useEffect(() => {
    if (!form.serviceType) {
      setPricing(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const beds = parseRoomCount(form.bedrooms);
      const baths = parseRoomCount(form.bathrooms);
      try {
        const result = await calcTotalAsync(
          {
            service: form.serviceType as ServiceType,
            bedrooms: beds,
            bathrooms: baths,
            extras: form.selectedExtras,
            extrasQuantities: {},
          },
          'one-time'
        );
        if (!cancelled) setPricing(result);
      } catch {
        if (!cancelled) setPricing(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.serviceType, form.bedrooms, form.bathrooms, form.selectedExtras]);

  const dynamicTotal = pricing?.total ?? 0;

  const updateForm = useCallback((field: keyof BookingFormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'serviceType' ? { selectedExtras: [] } : {}),
    }));
  }, []);

  const toggleExtra = (extraName: string) => {
    setForm((prev) => ({
      ...prev,
      selectedExtras: prev.selectedExtras.includes(extraName)
        ? prev.selectedExtras.filter((n) => n !== extraName)
        : [...prev.selectedExtras, extraName],
    }));
  };

  const canProceed = () => {
    if (step === 1) return !!form.serviceType;
    if (step === 2)
      return !!(form.clientName && form.clientEmail && form.clientPhone && form.address && form.suburb);
    if (step === 3) {
      if (!(form.date && form.time)) return false;
      if (serviceRequiresTeam(form.serviceType)) return true;
      return !!form.cleanerId;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!pricing || !form.serviceType) return;
    setSubmitError(null);
    setSubmitting(true);
    setPaymentStep('processing');

    const nameParts = form.clientName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '-';
    const bedrooms = parseRoomCount(form.bedrooms);
    const bathrooms = parseRoomCount(form.bathrooms);
    const requiresTeam = serviceRequiresTeam(form.serviceType);
    const serviceLabel = selectedServiceMeta?.label ?? form.serviceType;

    try {
      let bookingId = pendingBookingId;

      if (!bookingId) {
        const res = await fetch('/api/admin/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            service_type: form.serviceType,
            bedrooms,
            bathrooms,
            extras: form.selectedExtras,
            extrasQuantities: {},
            notes: form.notes,
            booking_date: form.date,
            booking_time: form.time,
            customer_first_name: firstName,
            customer_last_name: lastName,
            customer_email: form.clientEmail.trim(),
            customer_phone: form.clientPhone.trim(),
            address_line1: form.address.trim(),
            address_suburb: form.suburb.trim(),
            address_city: form.city.trim() || 'Cape Town',
            cleaner_id: requiresTeam ? null : form.cleanerId || null,
            total_amount: pricing.total,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok || !data?.booking?.id) {
          throw new Error(data?.error || 'Failed to create booking');
        }

        bookingId = data.booking.id as string;
        setPendingBookingId(bookingId);
      }

      const payRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const payData = await payRes.json().catch(() => ({}));

      if (payRes.ok && payData?.ok && typeof payData.authorization_url === 'string') {
        onSuccess({
          ...form,
          id: bookingId,
          amount: pricing.total,
          cleanerLabel: selectedCleaner?.name,
          serviceLabel,
          paymentPending: true,
        });
        window.location.href = payData.authorization_url;
        return;
      }

      const payErr =
        typeof payData?.error === 'string'
          ? payData.error
          : 'Payment could not be started. Use “Retry payment” or open the booking from the list.';
      setPaymentStep('form');
      onSuccess({
        ...form,
        id: bookingId,
        amount: pricing.total,
        cleanerLabel: selectedCleaner?.name,
        serviceLabel,
        paymentPending: true,
      });
      setSubmitError(payErr);
    } catch (e) {
      setPaymentStep('form');
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setPaymentStep('form');
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setPricing(null);
    setPendingBookingId(null);
    onClose();
  };

  const formatZAR = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(n);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900">New Booking</h2>
                  <p className="text-[10px] text-gray-400">Shalean Cleaning Services</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {paymentStep === 'form' && (
              <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50 px-6 py-3">
                <div className="flex items-center gap-0">
                  {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                            step > s.id
                              ? 'bg-indigo-600 text-white'
                              : step === s.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                          )}
                        >
                          {step > s.id ? <Check className="h-3 w-3" /> : s.id}
                        </div>
                        <span
                          className={cn(
                            'text-[11px] font-semibold transition-colors',
                            step === s.id ? 'text-indigo-600' : step > s.id ? 'text-gray-600' : 'text-gray-400'
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={cn('mx-2 h-px w-6 transition-colors', step > s.id ? 'bg-indigo-400' : 'bg-gray-200')} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6"
                  >
                    <h3 className="mb-1 text-sm font-bold text-gray-900">Select Service</h3>
                    <p className="mb-4 text-xs text-gray-400">
                      Loaded from your pricing configuration (same as the public booking form)
                    </p>
                    {loadingFormData ? (
                      <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading services…
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {sortedServices.map((svc, idx) => {
                          const color = SERVICE_CARD_COLORS[idx % SERVICE_CARD_COLORS.length];
                          const base =
                            formData?.pricing?.services?.[svc.type]?.base ?? null;
                          return (
                            <button
                              key={svc.type}
                              type="button"
                              onClick={() => updateForm('serviceType', svc.type)}
                              className={cn(
                                'flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all',
                                form.serviceType === svc.type
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              )}
                            >
                              <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                                style={{ backgroundColor: `${color}18` }}
                              >
                                <Sparkles className="h-5 w-5" style={{ color }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900">{svc.label}</p>
                                <p className="mt-0.5 truncate text-xs text-gray-500">{svc.description || svc.subLabel}</p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                {base != null ? (
                                  <p className="text-base font-extrabold text-gray-900">{formatZAR(base)}</p>
                                ) : (
                                  <p className="text-xs text-gray-400">—</p>
                                )}
                                <p className="mt-0.5 text-[10px] text-gray-400">from</p>
                                {form.serviceType === svc.type && (
                                  <div className="ml-auto mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4 p-6"
                  >
                    <div>
                      <h3 className="mb-1 text-sm font-bold text-gray-900">Client Details</h3>
                      <p className="text-xs text-gray-400">
                        Enter the client&apos;s information and service address
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>Full Name</span>
                          <span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2.5 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                          <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <input
                            type="text"
                            value={form.clientName}
                            onChange={(e) => updateForm('clientName', e.target.value)}
                            placeholder="Sarah Johnson"
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>Email Address</span>
                          <span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2.5 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                          <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <input
                            type="email"
                            value={form.clientEmail}
                            onChange={(e) => updateForm('clientEmail', e.target.value)}
                            placeholder="sarah@email.com"
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>Phone Number</span>
                          <span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2.5 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                          <span className="text-xs font-semibold text-gray-500">+27</span>
                          <input
                            type="tel"
                            value={form.clientPhone}
                            onChange={(e) => updateForm('clientPhone', e.target.value)}
                            placeholder="82 123 4567"
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>City</span>
                        </label>
                        <select
                          value={form.city}
                          onChange={(e) => updateForm('city', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="Cape Town">Cape Town</option>
                          <option value="Johannesburg">Johannesburg</option>
                          <option value="Durban">Durban</option>
                          <option value="Pretoria">Pretoria</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>Street Address</span>
                          <span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2.5 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <input
                            type="text"
                            value={form.address}
                            onChange={(e) => updateForm('address', e.target.value)}
                            placeholder="12 Main Road"
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>Suburb</span>
                          <span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.suburb}
                          onChange={(e) => updateForm('suburb', e.target.value)}
                          placeholder="Sea Point"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>Property Size</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={form.bedrooms}
                            onChange={(e) => updateForm('bedrooms', e.target.value)}
                            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          >
                            {['1', '2', '3', '4', '5', '6+'].map((v) => (
                              <option key={v} value={v}>
                                {v} bed
                              </option>
                            ))}
                          </select>
                          <select
                            value={form.bathrooms}
                            onChange={(e) => updateForm('bathrooms', e.target.value)}
                            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          >
                            {['1', '2', '3', '4+'].map((v) => (
                              <option key={v} value={v}>
                                {v} bath
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {allowedExtras.length > 0 && (
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-xs font-bold text-gray-700">
                            <span>Add extras</span>
                            <span className="ml-1 text-[11px] font-normal text-gray-400">(from pricing database)</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {allowedExtras.map((extraName) => {
                              const unit = formData?.extras?.prices?.[extraName] ?? 0;
                              const isSelected = form.selectedExtras.includes(extraName);
                              return (
                                <button
                                  key={extraName}
                                  type="button"
                                  onClick={() => toggleExtra(extraName)}
                                  className={cn(
                                    'flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold transition-all',
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                  )}
                                >
                                  <span>{extraName}</span>
                                  <span className="font-bold">+{formatZAR(unit)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>Special Instructions</span>
                        </label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => updateForm('notes', e.target.value)}
                          placeholder="Any special requests, gate codes, or specific areas to focus on…"
                          rows={3}
                          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5 p-6"
                  >
                    <div>
                      <h3 className="mb-1 text-sm font-bold text-gray-900">Schedule & Assign</h3>
                      <p className="text-xs text-gray-400">
                        {serviceRequiresTeam(form.serviceType)
                          ? 'Pick date and time. Team assignment can be completed from the full booking page if needed.'
                          : 'Pick a date, time slot, and assign a cleaner'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-700">
                          <span>Date</span>
                          <span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2.5 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <input
                            type="date"
                            value={form.date}
                            onChange={(e) => updateForm('date', e.target.value)}
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-gray-700">
                        <span>Time Slot</span>
                        <span className="ml-0.5 text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => updateForm('time', slot)}
                            className={cn(
                              'rounded-xl border-2 px-2 py-2 text-[11px] font-bold transition-all',
                              form.time === slot
                                ? 'border-indigo-500 bg-indigo-600 text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                            )}
                          >
                            <Clock className="mx-auto mb-0.5 h-3 w-3" />
                            {formatTimeSlotLabel(slot)}
                            <span className="block text-[9px] font-normal opacity-80">{slot}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-gray-700">
                        <span>{serviceRequiresTeam(form.serviceType) ? 'Assign cleaner (optional)' : 'Assign cleaner'}</span>
                        {!serviceRequiresTeam(form.serviceType) && (
                          <span className="ml-0.5 text-red-500">*</span>
                        )}
                      </label>
                      {loadingCleaners ? (
                        <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading cleaners…
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cleanerOptions.map((cleaner) => (
                            <button
                              key={cleaner.id}
                              type="button"
                              disabled={!cleaner.available}
                              onClick={() => updateForm('cleanerId', cleaner.id)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                                !cleaner.available
                                  ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-40'
                                  : form.cleanerId === cleaner.id
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              )}
                            >
                              <div
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: cleaner.color }}
                              >
                                {cleaner.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900">{cleaner.name}</p>
                                <p className="text-[10px] text-gray-500">
                                  {cleaner.rating > 0 && (
                                    <>
                                      <span>★ {cleaner.rating.toFixed(1)}</span>
                                      <span className="mx-1.5">·</span>
                                    </>
                                  )}
                                  <span>{cleaner.jobs} jobs</span>
                                  <span className="mx-1.5">·</span>
                                  <span className={cleaner.available ? 'font-bold text-green-600' : 'text-red-500'}>
                                    {cleaner.available ? 'Active' : 'Inactive'}
                                  </span>
                                </p>
                              </div>
                              {form.cleanerId === cleaner.id && (
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                          {cleanerOptions.length === 0 && !loadingCleaners && (
                            <p className="text-xs text-gray-500">No cleaners found. Add cleaners in the Cleaners section.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 4 && paymentStep === 'form' && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5 p-6"
                  >
                    <div>
                      <h3 className="mb-1 text-sm font-bold text-gray-900">Review & Payment</h3>
                      <p className="text-xs text-gray-400">
                        Confirm booking details and process payment via Paystack
                      </p>
                    </div>

                    <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Booking Summary</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Client', value: form.clientName },
                          {
                            label: 'Service',
                            value: (selectedServiceMeta?.label ?? form.serviceType) || '—',
                          },
                          {
                            label: 'Cleaner',
                            value: serviceRequiresTeam(form.serviceType)
                              ? form.cleanerId
                                ? (selectedCleaner?.name ?? '—')
                                : 'Team / assign later'
                              : (selectedCleaner?.name ?? '—'),
                          },
                          {
                            label: 'Date & Time',
                            value:
                              form.date && form.time
                                ? `${form.date} · ${formatTimeSlotLabel(form.time)} (${form.time})`
                                : '—',
                          },
                          {
                            label: 'Address',
                            value: form.address && form.suburb ? `${form.address}, ${form.suburb}` : '—',
                          },
                          {
                            label: 'Bedrooms / Baths',
                            value: `${form.bedrooms} bed · ${form.bathrooms} bath`,
                          },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-500">{row.label}</span>
                            <span className="max-w-[180px] truncate text-right text-xs font-semibold text-gray-800">
                              {row.value}
                            </span>
                          </div>
                        ))}

                        {form.selectedExtras.map((name) => {
                          const unit = formData?.extras?.prices?.[name] ?? 0;
                          return (
                            <div key={name} className="flex items-center justify-between gap-4">
                              <span className="text-xs text-gray-500">{name}</span>
                              <span className="text-xs font-semibold text-gray-800">+{formatZAR(unit)}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-2 border-t border-gray-200 pt-3">
                        {pricing && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Subtotal (incl. rooms & extras)</span>
                            <span>{formatZAR(pricing.subtotal)}</span>
                          </div>
                        )}
                        {pricing && pricing.serviceFee > 0 && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Service fee</span>
                            <span>{formatZAR(pricing.serviceFee)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">Total Amount</span>
                          <div className="text-right">
                            <motion.span
                              key={dynamicTotal}
                              initial={{ scale: 1.08 }}
                              animate={{ scale: 1 }}
                              className="text-lg font-extrabold text-indigo-600"
                            >
                              {pricing ? formatZAR(dynamicTotal) : '—'}
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-xs font-bold text-gray-700">Payment Method</p>
                      <div className="flex items-center gap-3 rounded-xl border-2 border-indigo-500 bg-indigo-50 p-4">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          <CreditCard className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Paystack</p>
                          <p className="text-xs text-gray-500">Secure card, EFT, or instant pay</p>
                        </div>
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-[10px] text-gray-400">
                      A real booking record is created in Supabase, then you are redirected to Paystack to pay. After
                      payment, confirmation and invoicing run as configured for your site.
                    </p>
                    {pendingBookingId && (
                      <p className="text-center text-[10px] font-medium text-amber-700">
                        Booking {pendingBookingId} saved — retry payment or open it from Bookings.
                      </p>
                    )}
                  </motion.div>
                )}

                {paymentStep === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center gap-4 p-12 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {pendingBookingId ? 'Starting Paystack…' : 'Creating booking…'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {pendingBookingId ? 'Opening secure checkout' : 'Saving to database'}
                      </p>
                    </div>
                    <div className="h-1.5 w-48 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.4, ease: 'easeInOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400">Do not close this window until checkout opens.</p>
                  </motion.div>
                )}

                {paymentStep === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center gap-4 p-12 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
                    >
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Booking Confirmed!</p>
                      <p className="mt-1 text-xs text-gray-400">You can close this dialog</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['✓ Booking saved'].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}


              </AnimatePresence>
            </div>

            {paymentStep === 'form' && (
              <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={() => (step === 1 ? handleClose() : setStep((s) => s - 1))}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900"
                >
                  {step > 1 && <ChevronLeft className="h-4 w-4" />}
                  <span>{step === 1 ? 'Cancel' : 'Back'}</span>
                </button>

                {step < 4 ? (
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={!canProceed()}
                    onClick={() => setStep((s) => s + 1)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all',
                      canProceed()
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                    )}
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={submitting || !pricing || !form.serviceType}
                    onClick={handlePayment}
                    className={cn(
                      'flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-shadow hover:shadow-lg',
                      (submitting || !pricing || !form.serviceType) && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    <span>
                      {pendingBookingId ? 'Retry payment' : 'Pay'} {pricing ? formatZAR(dynamicTotal) : '—'}
                    </span>
                  </motion.button>
                )}
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
