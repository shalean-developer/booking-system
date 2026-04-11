'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  CreditCard,
  Tag,
  Heart,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface PromoResult {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  label: string;
}

interface TipOption {
  id: string;
  label: string;
  value: number;
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
  extrasSummary: string;
  totalZar: number;
  discountAmount: number;
  appliedPromoCode: string;
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

const TIP_OPTIONS: TipOption[] = [
  { id: 'no-tip', label: 'No Tip', value: 0 },
  { id: 'tip-50', label: 'R50', value: 50 },
  { id: 'tip-100', label: 'R100', value: 100 },
  { id: 'tip-200', label: 'R200', value: 200 },
];

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
  extrasSummary,
  totalZar,
  discountAmount,
  appliedPromoCode,
}: BookingStep4ConfirmationProps) {
  const [unit, setUnit] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const selectedTip = useMemo(
    () => TIP_OPTIONS.find((t) => t.value === data.tipAmount) ?? TIP_OPTIONS[0],
    [data.tipAmount]
  );

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
    { id: 'cleaner', label: 'Cleaner', value: cleanerLabel },
    { id: 'extras', label: 'Extras', value: extrasSummary },
  ];

  const contactErrorKeys = ['name', 'email', 'phone', 'address'] as const;
  const hasContactErrors = attempted && contactErrorKeys.some((k) => errors[k]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      {/* ── Header (matches steps 1–3) ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
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
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-bold text-red-700">{paymentError}</p>
          </div>
        </div>
      )}

      {/* ── Page layout (matches step 3) ── */}
      <div
        ref={formRef}
        className="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 items-start pb-40 lg:pb-8"
      >
        {/* ── LEFT: form ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          <p className="text-xs font-bold tracking-widest text-violet-600 uppercase">Step 4 of 4</p>

          <section aria-labelledby="contact-heading">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5">
                        VISA
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">
                        MC
                      </span>
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5">
                        AMEX
                      </span>
                      <span className="text-[10px] text-gray-400 ml-1">Accepted</span>
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

          <section aria-labelledby="promo-heading">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <SectionLabel
                id="promo-heading"
                icon={
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                }
                title="Promo Code"
                subtitle="Have a discount code? Apply it below"
              />

              <AnimatePresence mode="wait">
                {data.promoCode ? (
                  <motion.div
                    key="applied"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-3 bg-green-50 border-2 border-green-300 rounded-xl px-4 py-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-green-700">
                        <span>{data.promoCode}</span>
                        <span className="ml-2 text-green-600 font-semibold">
                          — {appliedPromo?.label ?? 'Discount'}
                        </span>
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        Saving {formatZarSimple(discountAmount)} on your booking
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors font-semibold flex-shrink-0"
                    >
                      Remove
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value.toUpperCase());
                          setPromoError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPromoClick()}
                        className={cn(
                          'flex-1 rounded-xl border-2 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 bg-white outline-none transition-all duration-200 uppercase tracking-widest font-mono',
                          'focus:border-violet-500',
                          promoError ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        )}
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromoClick}
                        className="px-5 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors flex-shrink-0 shadow-md shadow-violet-200"
                      >
                        Apply
                      </button>
                    </div>
                    <AnimatePresence>
                      {promoError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-xs text-red-500 mt-2 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>{promoError}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                    {promoSuccess && (
                      <p className="text-xs text-green-600 mt-2 font-semibold">{promoSuccess}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section aria-labelledby="tip-heading">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <SectionLabel
                id="tip-heading"
                icon={
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                }
                title="Add a Tip"
                subtitle="Show appreciation — 100% goes to your cleaner"
              />

              <div className="flex flex-wrap gap-2">
                {TIP_OPTIONS.map((tip) => {
                  const isSelected = selectedTip.id === tip.id;
                  return (
                    <motion.button
                      key={tip.id}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setData((p) => ({ ...p, tipAmount: tip.value }))}
                      className={cn(
                        'px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all duration-200',
                        isSelected
                          ? 'bg-violet-600 text-white border-transparent shadow-md shadow-violet-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:bg-violet-50/40'
                      )}
                    >
                      {tip.label}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedTip.value > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-violet-500 fill-current" />
                      <p className="text-xs text-violet-600 font-semibold">
                        <span>Thank you! </span>
                        <span>{formatZarSimple(selectedTip.value)} tip added for your cleaner.</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* ── RIGHT: Sticky Summary (matches step 3) ── */}
        <aside
          className="hidden lg:flex w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-6 flex-col gap-4"
          aria-label="Booking summary"
        >
          <div className="rounded-2xl overflow-hidden shadow-md flex flex-col min-h-0">
            <div className="bg-gradient-to-br from-violet-600 to-violet-800 px-5 py-5 flex-shrink-0">
              <p className="text-violet-200 text-xs font-semibold tracking-widest uppercase mb-1">Your total</p>
              <motion.p
                key={totalZar}
                initial={{ scale: 1.06, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-4xl font-extrabold text-white tracking-tight"
              >
                {formatZarSimple(totalZar)}
              </motion.p>
              <p className="text-violet-300 text-sm mt-1 font-medium">
                <span>{serviceTitle}</span>
                {data.promoCode && <span> · {appliedPromo?.label ?? data.promoCode}</span>}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto bg-white px-5 py-4 flex flex-col gap-3 min-h-0">
              {summaryRows.map((row) => (
                <div key={row.id} className="flex justify-between items-center text-sm text-gray-600">
                  <span>{row.label}</span>
                  <motion.span
                    key={`${row.id}-${row.value}`}
                    initial={{ opacity: 0.5, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-semibold text-gray-900 text-right max-w-[60%] truncate"
                  >
                    {row.value}
                  </motion.span>
                </div>
              ))}

              <AnimatePresence>
                {discountAmount > 0 && data.promoCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Promo</span>
                      <span className="font-bold text-green-600">−{formatZarSimple(discountAmount)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedTip.value > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tip</span>
                      <span className="font-bold text-violet-600">+{formatZarSimple(selectedTip.value)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <motion.span
                  key={totalZar}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-base font-extrabold text-gray-900"
                >
                  {formatZarSimple(totalZar)}
                </motion.span>
              </div>
            </div>

            <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-gray-100 bg-white">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={shaking ? { duration: 0.5 } : {}}
                onClick={handleSubmit}
                disabled={isProcessing}
                className={cn(
                  'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200',
                  isProcessing
                    ? 'bg-violet-400 text-white cursor-not-allowed'
                    : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700 cursor-pointer'
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{isProcessing ? 'Processing…' : 'Finalize Booking'}</span>
                {!isProcessing && <ArrowRight className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck size={13} className="text-green-500 flex-shrink-0" />
              Secure 256-bit encrypted payment
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
              Free cancellation up to 24 hrs before
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles size={13} className="text-violet-500 flex-shrink-0" />
              No hidden fees — ever
            </div>
          </div>
        </aside>
      </div>

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

        <div className="px-4 py-3">
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
