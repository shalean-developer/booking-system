'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  CreditCard,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { BookingSummary } from '@/components/booking/booking-summary';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

/** Paystack checkout options commonly available to South African customers (cards + EFT + QR wallets). */
const PAYSTACK_ZA_METHOD_LABELS = [
  'Visa',
  'Mastercard',
  'SnapScan',
  'Scan to Pay (QR)',
  'Capitec Pay',
  'Instant EFT',
] as const;

interface PromoResult {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  label: string;
}

interface SummaryRow {
  id: string;
  label: string;
  value: string;
  accent?: string;
}

export interface BookingStep4ConfirmationProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  errors: Partial<Record<keyof BookingFormData, string>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof BookingFormData, string>>>>;
  paymentError: string;
  /** When checkout hits an unpaid duplicate slot, parent passes the existing booking id and handlers */
  unpaidDuplicateBookingId?: string | null;
  onPayExistingUnpaidBooking?: () => void;
  onCancelUnpaidDuplicate?: () => void;
  duplicateUnpaidAction?: 'idle' | 'pay' | 'cancel';
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoError: string;
  setPromoError: (v: string) => void;
  onApplyPromo: () => void;
  onBack: () => void;
  onFinalize: () => void;
  isProcessing: boolean;
  showLoginCta: boolean;
  onLogin: () => void;
  serviceTitle: string;
  propertySummary: string;
  dateTimeLabel: string;
  /** e.g. "Fri, 20 Jun" for the mobile sticky summary line */
  shortDateLabel: string;
  cleanerLabel: string;
  /** Individual cleaner avatar; omit or null for team bookings — fallback initials/icon shown */
  cleanerPhotoUrl?: string | null;
  extrasSummary: string;
  totalZar: number;
  discountAmount: number;
  appliedPromoCode: string;
  /** Engine breakdown rows (same source as steps 1–3). */
  enginePriceRows?: { id: string; label: string; value: number }[];
  pricingContext?: { estimatedJobHours?: number; teamSize?: number } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Mirrors booking-system promo keys + labels for the UI */
const PROMO_META: Record<string, PromoResult> = {
  SHALEAN10: { code: 'SHALEAN10', type: 'percent', value: 10, label: '10% off' },
  SAVE20: { code: 'SAVE20', type: 'percent', value: 20, label: '20% off' },
  SAVE50: { code: 'SAVE50', type: 'fixed', value: 50, label: 'R50 off' },
  NEWCLIENT: { code: 'NEWCLIENT', type: 'fixed', value: 100, label: 'R100 off' },
  FIRSTCLEAN: { code: 'FIRSTCLEAN', type: 'fixed', value: 100, label: 'R100 off' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Matches step 3 summary display */
function formatZarSimple(price: number) {
  return `R ${price.toLocaleString('en-ZA')}`;
}

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({
  id,
  icon,
  title,
  subtitle,
  action,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-3 mb-5">
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <h2 id={id} className="text-base font-bold text-gray-900 leading-tight tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

const FieldInput = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  optional,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5">
      <span>{label}</span>
      {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full rounded-xl border-2 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 bg-white outline-none transition-all duration-200',
        'focus:border-violet-500 focus:ring-0',
        error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
      )}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    <AnimatePresence>
      {error && (
        <motion.p
          id={`${id}-error`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

/** @alias BookingConfirmationForm — wired booking checkout UI (step 4) */
export function BookingStep4Confirmation({
  data,
  setData,
  errors,
  setErrors,
  paymentError,
  unpaidDuplicateBookingId = null,
  onPayExistingUnpaidBooking,
  onCancelUnpaidDuplicate,
  duplicateUnpaidAction = 'idle',
  promoInput,
  setPromoInput,
  promoError,
  setPromoError,
  onApplyPromo,
  onBack,
  onFinalize,
  isProcessing,
  showLoginCta,
  onLogin,
  serviceTitle,
  propertySummary,
  dateTimeLabel,
  shortDateLabel,
  cleanerLabel,
  cleanerPhotoUrl = null,
  extrasSummary,
  totalZar,
  discountAmount,
  appliedPromoCode,
  enginePriceRows,
  pricingContext = null,
}: BookingStep4ConfirmationProps) {
  const [unit, setUnit] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const appliedPromo = appliedPromoCode ? PROMO_META[appliedPromoCode.toUpperCase()] : null;

  const handleFieldChange = (field: keyof BookingFormData) => (val: string) => {
    setData((prev) => ({ ...prev, [field]: val }));
    if (attempted) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): ContactErrors => {
    const errs: ContactErrors = {};
    if (!data.name.trim()) errs.name = 'Full name is required';
    if (!data.email.trim()) errs.email = 'Email is required';
    else if (!validateEmail(data.email)) errs.email = 'Enter a valid email address';
    if (!data.phone.trim()) errs.phone = 'Phone number is required';
    if (!data.address.trim()) errs.address = 'Address is required';
    return errs;
  };

  const handleApplyPromoClick = () => {
    setPromoSuccess('');
    onApplyPromo();
  };

  useEffect(() => {
    if (appliedPromoCode && !promoError) {
      const meta = PROMO_META[appliedPromoCode.toUpperCase()];
      setPromoSuccess(meta ? `${meta.label} applied!` : 'Promo applied!');
    } else {
      setPromoSuccess('');
    }
  }, [appliedPromoCode, promoError]);

  const handleRemovePromo = () => {
    setData((prev) => ({ ...prev, promoCode: '' }));
    setPromoSuccess('');
    setPromoError('');
  };

  const handleSubmit = () => {
    setAttempted(true);
    const errs = validate();
    const mapped: Partial<Record<keyof BookingFormData, string>> = {
      ...(errs.name && { name: errs.name }),
      ...(errs.email && { email: errs.email }),
      ...(errs.phone && { phone: errs.phone }),
      ...(errs.address && { address: errs.address }),
    };
    if (Object.keys(mapped).length > 0) {
      setErrors((prev) => ({ ...prev, ...mapped }));
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    onFinalize();
  };

  const summaryRows: SummaryRow[] = [
    { id: 'service', label: 'Service', value: serviceTitle },
    { id: 'property', label: 'Property', value: propertySummary },
    { id: 'datetime', label: 'Date & Time', value: dateTimeLabel },
    { id: 'extras', label: 'Extras', value: extrasSummary },
  ];

  const contactErrorKeys = ['name', 'email', 'phone', 'address'] as const;
  const hasContactErrors = attempted && contactErrorKeys.some((k) => errors[k]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      {/* ── Header (matches steps 1–3) ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
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
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Shalean Cleaning Services
            </p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Confirm &amp; Secure</h1>
          </div>
        </div>
        <BookingFlowStepIndicator activeStep={4} />
      </header>

      {paymentError && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex flex-col sm:flex-row sm:items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-bold text-red-700">{paymentError}</p>
              {unpaidDuplicateBookingId && (
                <p className="text-xs text-red-600/90 leading-relaxed">
                  A draft for this date and time is already in progress (same email). Do not click Finalize again
                  — open Paystack using the button below, or cancel that draft to replace it with this new
                  summary.
                </p>
              )}
              {unpaidDuplicateBookingId && onPayExistingUnpaidBooking && onCancelUnpaidDuplicate && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onPayExistingUnpaidBooking}
                    disabled={duplicateUnpaidAction !== 'idle'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white text-sm font-bold px-4 py-2.5 hover:bg-violet-700 disabled:opacity-60 disabled:pointer-events-none transition-colors"
                  >
                    {duplicateUnpaidAction === 'pay' ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      <CreditCard className="w-4 h-4" aria-hidden />
                    )}
                    Pay for existing booking
                  </button>
                  <button
                    type="button"
                    onClick={onCancelUnpaidDuplicate}
                    disabled={duplicateUnpaidAction !== 'idle'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-red-700 text-sm font-bold px-4 py-2.5 hover:bg-red-50 disabled:opacity-60 disabled:pointer-events-none transition-colors"
                  >
                    {duplicateUnpaidAction === 'cancel' ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      <Ban className="w-4 h-4 opacity-90" aria-hidden />
                    )}
                    Cancel &amp; replace with this one
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BookingFlowLayout
        mainRef={formRef}
        sidebarOnMobile
        sidebar={
          <BookingSummary
            mode="full"
            step={4}
            data={data}
            setData={setData}
            summaryRows={summaryRows}
            totalZar={totalZar}
            discountAmount={discountAmount}
            cleanerLabel={cleanerLabel}
            cleanerPhotoUrl={cleanerPhotoUrl}
            isProcessing={isProcessing}
            shaking={shaking}
            onFinalize={handleSubmit}
            promoInput={promoInput}
            setPromoInput={setPromoInput}
            promoError={promoError}
            setPromoError={setPromoError}
            onApplyPromo={handleApplyPromoClick}
            onRemovePromo={handleRemovePromo}
            promoSuccess={promoSuccess}
            appliedPromoLabel={appliedPromo?.label ?? null}
            enginePriceRows={enginePriceRows}
            pricingContext={pricingContext}
          />
        }
      >
          <p className="text-xs font-bold tracking-widest text-violet-600 uppercase">Step 4 of 4</p>

          <section aria-labelledby="contact-heading">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
              <SectionLabel
                id="contact-heading"
                icon={
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                }
                title="Contact Information"
                subtitle="We'll send your booking confirmation here"
                action={
                  showLoginCta ? (
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
                    >
                      <span>Login</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : undefined
                }
              />

              <div className="space-y-4">
                <FieldInput
                  id="fullName"
                  label="Full Name"
                  placeholder="e.g. Sarah Johnson"
                  value={data.name}
                  onChange={handleFieldChange('name')}
                  error={errors.name}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldInput
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={data.email}
                    onChange={handleFieldChange('email')}
                    error={errors.email}
                  />
                  <FieldInput
                    id="phone"
                    label="Phone Number"
                    type="tel"
                    placeholder="+27 82 000 0000"
                    value={data.phone}
                    onChange={handleFieldChange('phone')}
                    error={errors.phone}
                  />
                </div>
                <FieldInput
                  id="address"
                  label="Full Address"
                  placeholder="e.g. 12 Main Road, Sea Point, Cape Town"
                  value={data.address}
                  onChange={handleFieldChange('address')}
                  error={errors.address}
                />
                <FieldInput
                  id="unit"
                  label="Unit / Apartment"
                  placeholder="e.g. Apt 4B"
                  value={unit}
                  onChange={setUnit}
                  optional
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="payment-heading">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
              <SectionLabel
                id="payment-heading"
                icon={
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                }
                title="Payment Method"
                subtitle="Secure and encrypted payment processing"
              />

              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-violet-500 bg-violet-50 p-4 flex items-center gap-4 shadow-sm shadow-violet-100">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">Pay Online</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Cards, Instant EFT, SnapScan &amp; QR payments supported
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {PAYSTACK_ZA_METHOD_LABELS.map((label) => (
                        <span
                          key={label}
                          className="text-xs px-2 py-1 border border-gray-200 rounded bg-white text-gray-700 font-medium"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-violet-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 flex items-center gap-4 opacity-50 cursor-not-allowed select-none">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-500">Pay Later</p>
                    <p className="text-xs text-gray-400 mt-0.5">Pay on the day of the clean</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-200 rounded-full px-2.5 py-1 flex-shrink-0">
                    Coming Soon
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  <span>Your payment is </span>
                  <strong>256-bit SSL encrypted</strong>
                  <span>. We never store your card details.</span>
                </p>
              </div>
            </div>
          </section>
      </BookingFlowLayout>

      {/* ── Mobile bottom bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_32px_rgba(0,0,0,0.08)]">
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-4 space-y-0.5">
                <p className="text-xs text-gray-500 font-medium">
                  <span>
                    {serviceTitle} · {shortDateLabel}
                  </span>
                </p>
                {data.promoCode && (
                  <p className="text-xs font-semibold text-violet-600">
                    {(appliedPromo?.label ?? data.promoCode) + ' applied'}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <motion.p
                  key={totalZar}
                  initial={{ y: -4, opacity: 0.6 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-lg font-extrabold text-gray-900"
                >
                  {formatZarSimple(totalZar)}
                </motion.p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">total</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={shaking ? { duration: 0.5 } : {}}
            onClick={handleSubmit}
            disabled={isProcessing}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200',
              isProcessing
                ? 'bg-violet-400 text-white cursor-not-allowed'
                : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
            <span>{isProcessing ? 'Processing…' : 'Finalize Booking'}</span>
            {!isProcessing && <ArrowRight className="w-5 h-5" />}
          </motion.button>
          <AnimatePresence>
            {hasContactErrors && !isProcessing && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-500 text-center mt-2 flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Please fill in all required fields</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export { BookingStep4Confirmation as BookingConfirmationForm };
