'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Ban,
  Phone,
  User,
  Mail,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { TipCard } from '@/components/booking/tip-card';
import { StickyCTA } from '@/components/booking/mobile/sticky-cta';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactErrors {
  email?: string;
  phone?: string;
}

interface PromoResult {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  label: string;
}

interface SelectedCleanerSummary {
  name: string;
  photoUrl?: string | null;
  rating?: number;
  reviewCount?: number;
}

export interface BookingStep4ConfirmationProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  errors: Partial<Record<keyof BookingFormData, string>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof BookingFormData, string>>>>;
  paymentError: string;
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
  /** e.g. Wed 22 Apr · 8:00 am — compact summary line */
  summaryDateTime: string;
  /** Street + suburb for the top summary */
  addressLine: string;
  numberOfCleaners: number;
  workHoursLabel: string;
  selectedCleaner?: SelectedCleanerSummary | null;
  shortDateLabel: string;
  totalZar: number;
  discountAmount: number;
  appliedPromoCode: string;
  /** Logged-in user email fallback for validation/prefill. */
  accountEmail?: string | null;
  showLoyaltyBlock?: boolean;
  loyaltyBalance?: number;
  applyLoyaltyPoints?: boolean;
  onApplyLoyaltyPointsChange?: (v: boolean) => void;
  useLoyaltyPointsInput?: number;
  onUseLoyaltyPointsInputChange?: (v: number) => void;
}

const PROMO_META: Record<string, PromoResult> = {
  SHALEAN10: { code: 'SHALEAN10', type: 'percent', value: 10, label: '10% off' },
  SAVE20: { code: 'SAVE20', type: 'percent', value: 20, label: '20% off' },
  SAVE50: { code: 'SAVE50', type: 'fixed', value: 50, label: 'R50 off' },
  NEWCLIENT: { code: 'NEWCLIENT', type: 'fixed', value: 100, label: 'R100 off' },
  FIRSTCLEAN: { code: 'FIRSTCLEAN', type: 'fixed', value: 100, label: 'R100 off' },
};

function formatZarSimple(price: number) {
  return `R ${price.toLocaleString('en-ZA')}`;
}

function formatZarHero(price: number) {
  return `R${price.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
}

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const FieldInput = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  optional,
  autoComplete,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
  autoComplete?: string;
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-gray-500 mb-2">
      <span>{label}</span>
      {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full rounded-2xl border-2 px-4 py-4 text-base text-gray-900 placeholder:text-gray-300 bg-white outline-none transition-all duration-200',
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

/** Sidebar: Due now — Shalean blue gradient + primary-style CTA */
function SidebarCheckoutCard({
  totalZar,
  shaking,
  selectedCleaner,
  tipAmount,
  onTipChange,
  isProcessing,
}: {
  totalZar: number;
  shaking: boolean;
  selectedCleaner?: SelectedCleanerSummary | null;
  tipAmount: number;
  onTipChange: (value: number) => void;
  isProcessing: boolean;
}) {
  const cleanerName = selectedCleaner?.name?.trim() || 'Best available cleaner';

  return (
    <div className="rounded-xl border border-primary/20 bg-white p-1 shadow-md shadow-primary/10 space-y-2">
      <TipCard
        cleanerName={cleanerName}
        cleanerPhotoUrl={selectedCleaner?.photoUrl ?? null}
        headerTone="blue"
        tipAmount={tipAmount}
        onTipChange={onTipChange}
        disabled={isProcessing}
      />

      <motion.div
        animate={shaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={shaking ? { duration: 0.45 } : {}}
        className="rounded-[10px] bg-gradient-to-r from-primary to-blue-500 text-white p-3.5 flex flex-row items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium text-white/85 uppercase tracking-wide">Due now</p>
          <p className="text-xl font-bold tracking-tight tabular-nums mt-0.5 drop-shadow-sm">
            {formatZarHero(totalZar)}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/** Main column: price hero, final-price line, primary CTA, urgency + trust */
function MainColumnPriceAndCta({
  totalZar,
  isProcessing,
  shaking,
  onPay,
}: {
  totalZar: number;
  isProcessing: boolean;
  shaking: boolean;
  onPay: () => void;
}) {
  return (
    <div className="space-y-3">
      <motion.div
        animate={shaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={shaking ? { duration: 0.45 } : {}}
        className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm"
      >
        <p className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight tabular-nums">
          {formatZarHero(totalZar)}
        </p>
        <p className="text-sm font-semibold text-gray-800 mt-1">Final price</p>
        <p className="text-xs text-gray-500 mt-2">Final price — no hidden fees</p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onPay}
          disabled={isProcessing}
          className={cn(
            'hidden lg:flex mt-5 w-full rounded-xl py-3.5 text-sm font-semibold items-center justify-center gap-2 shadow-md transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            isProcessing && 'opacity-60 cursor-not-allowed hover:bg-primary'
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Pay now</span>
              <span aria-hidden>→</span>
            </>
          )}
        </motion.button>
      </motion.div>
      <p className="text-xs text-orange-500 text-center px-1">
        We&apos;re holding this time for you · slots fill quickly
      </p>
      <div className="space-y-1 text-center px-2">
        <p className="text-[11px] text-gray-500">Secure checkout via Paystack · No card details stored</p>
        <p className="text-[11px] text-gray-400">✔ No hidden fees · ✔ Free cancellation</p>
      </div>
    </div>
  );
}

type Step4SidebarProps = {
  totalZar: number;
  isProcessing: boolean;
  shaking: boolean;
  onFinalize: () => void;
  selectedCleaner?: SelectedCleanerSummary | null;
  tipAmount: number;
  onTipChange: (value: number) => void;
  showLoyaltyBlock: boolean;
  loyaltyBalance: number;
  applyLoyaltyPoints: boolean;
  onApplyLoyaltyPointsChange?: (v: boolean) => void;
  useLoyaltyPointsInput: number;
  onUseLoyaltyPointsInputChange?: (v: number) => void;
  data: BookingFormData;
  appliedPromo: PromoResult | null;
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoError: string;
  promoSuccess: string;
  discountAmount: number;
  handleApplyPromoClick: () => void;
  handleRemovePromo: () => void;
  setPromoError: (v: string) => void;
};

function Step4Sidebar(props: Step4SidebarProps) {
  const {
    totalZar,
    isProcessing,
    shaking,
    onFinalize,
    selectedCleaner,
    tipAmount,
    onTipChange,
    showLoyaltyBlock,
    loyaltyBalance,
    applyLoyaltyPoints,
    onApplyLoyaltyPointsChange,
    useLoyaltyPointsInput,
    onUseLoyaltyPointsInputChange,
    data,
    appliedPromo,
    promoInput,
    setPromoInput,
    promoError,
    promoSuccess,
    discountAmount,
    handleApplyPromoClick,
    handleRemovePromo,
    setPromoError,
  } = props;

  return (
    <aside aria-label="Checkout summary and discounts" className="w-full max-w-[360px] lg:ml-auto flex flex-col gap-3">
      <SidebarCheckoutCard
        totalZar={totalZar}
        shaking={shaking}
        selectedCleaner={selectedCleaner}
        tipAmount={tipAmount}
        onTipChange={onTipChange}
        isProcessing={isProcessing}
      />

      <div className="rounded-xl border border-gray-200/90 bg-white/95 p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discounts</h4>

        {showLoyaltyBlock && onApplyLoyaltyPointsChange && onUseLoyaltyPointsInputChange && (
          <>
            <label className="flex items-start gap-3 cursor-pointer min-h-[44px] py-0.5 -ml-0.5">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                checked={applyLoyaltyPoints}
                onChange={(e) => onApplyLoyaltyPointsChange(e.target.checked)}
              />
              <span className="min-w-0">
                <span className="text-sm text-gray-800 leading-snug block">
                  Apply R{loyaltyBalance} rewards to this booking
                </span>
                <span className="text-xs text-gray-500 mt-0.5 block">Save instantly on this booking</span>
              </span>
            </label>
            {applyLoyaltyPoints && (
              <div className="pl-8">
                <label htmlFor="loyalty-sidebar" className="block text-[11px] font-medium text-gray-500 mb-1">
                  Points to use (max {loyaltyBalance})
                </label>
                <input
                  id="loyalty-sidebar"
                  type="number"
                  min={0}
                  max={loyaltyBalance}
                  value={useLoyaltyPointsInput || ''}
                  onChange={(e) => {
                    const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    onUseLoyaltyPointsInputChange(Math.min(n, loyaltyBalance));
                  }}
                  className="w-full max-w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>
            )}
            <div className="h-px bg-gray-100" aria-hidden />
          </>
        )}

        <div className="space-y-2">
          <label htmlFor="sidebar-promo-input" className="text-xs font-medium text-gray-700">
            Promo code
          </label>
          {data.promoCode ? (
            <div className="flex items-start justify-between gap-2 rounded-lg border border-emerald-200/90 bg-emerald-50/80 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-900 font-mono tracking-wide">{data.promoCode}</p>
                {appliedPromo ? <p className="text-xs text-emerald-800">{appliedPromo.label}</p> : null}
                {discountAmount > 0 && (
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">−{formatZarSimple(discountAmount)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-row gap-2 w-full min-w-0 items-stretch sm:items-center">
              <input
                id="sidebar-promo-input"
                type="text"
                autoComplete="off"
                placeholder="Enter code"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  setPromoError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromoClick()}
                className={cn(
                  'min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm font-mono uppercase tracking-wide outline-none',
                  'focus:border-primary focus:ring-1 focus:ring-primary/25',
                  promoError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                )}
              />
              <button
                type="button"
                onClick={handleApplyPromoClick}
                className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                Apply
              </button>
            </div>
          )}
          {promoError ? (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {promoError}
            </p>
          ) : null}
          {promoSuccess ? <p className="text-xs text-emerald-700 font-medium">{promoSuccess}</p> : null}
        </div>
      </div>
    </aside>
  );
}

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
  summaryDateTime,
  addressLine,
  numberOfCleaners,
  workHoursLabel,
  selectedCleaner = null,
  shortDateLabel,
  totalZar,
  discountAmount,
  appliedPromoCode,
  accountEmail = null,
  showLoyaltyBlock = false,
  loyaltyBalance = 0,
  applyLoyaltyPoints = false,
  onApplyLoyaltyPointsChange,
  useLoyaltyPointsInput = 0,
  onUseLoyaltyPointsInputChange,
}: BookingStep4ConfirmationProps) {
  const [attempted, setAttempted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');
  const [contactExpanded, setContactExpanded] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const appliedPromo = appliedPromoCode ? PROMO_META[appliedPromoCode.toUpperCase()] : null;
  const cleanerLine =
    numberOfCleaners <= 1 ? '1 cleaner' : `${numberOfCleaners} cleaners`;

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
    if (!data.phone.trim()) errs.phone = 'Phone number is required';
    const eff = data.email.trim() || accountEmail?.trim() || '';
    if (!eff) errs.email = 'Email is required for payment';
    else if (!validateEmail(eff)) errs.email = 'Enter a valid email';
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
      ...(errs.phone && { phone: errs.phone }),
      ...(errs.email && { email: errs.email }),
    };
    if (Object.keys(mapped).length > 0) {
      setContactExpanded(true);
      setErrors((prev) => {
        const next = { ...prev, ...mapped };
        delete next.name;
        delete next.address;
        return next;
      });
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    onFinalize();
  };

  const contactErrorKeys = ['phone', 'email'] as const;
  const hasContactErrors = attempted && contactErrorKeys.some((k) => errors[k]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
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
            <h1 className="text-lg font-bold text-gray-900 leading-tight">You&apos;re almost done</h1>
            <p className="text-sm text-gray-500 mt-0.5">Secure your clean in seconds</p>
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
                  A draft for this date and time is already in progress (same email). Use the buttons below to pay
                  that booking or cancel it to continue with this one.
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
        mobileSidebarAfterMain
        sidebar={
          <Step4Sidebar
            totalZar={totalZar}
            isProcessing={isProcessing}
            shaking={shaking}
            onFinalize={handleSubmit}
            selectedCleaner={selectedCleaner}
            tipAmount={data.tipAmount}
            onTipChange={(value) => setData((prev) => ({ ...prev, tipAmount: value }))}
            showLoyaltyBlock={Boolean(showLoyaltyBlock && onApplyLoyaltyPointsChange && onUseLoyaltyPointsInputChange)}
            loyaltyBalance={loyaltyBalance}
            applyLoyaltyPoints={applyLoyaltyPoints}
            onApplyLoyaltyPointsChange={onApplyLoyaltyPointsChange}
            useLoyaltyPointsInput={useLoyaltyPointsInput}
            onUseLoyaltyPointsInputChange={onUseLoyaltyPointsInputChange}
            data={data}
            appliedPromo={appliedPromo ?? null}
            promoInput={promoInput}
            setPromoInput={setPromoInput}
            promoError={promoError}
            promoSuccess={promoSuccess}
            discountAmount={discountAmount}
            handleApplyPromoClick={handleApplyPromoClick}
            handleRemovePromo={handleRemovePromo}
            setPromoError={setPromoError}
          />
        }
        mainColumnClassName="gap-5"
      >
        <div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Step 4 of 4</p>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mt-1">Review &amp; pay</h2>
          <p className="text-sm text-gray-500 mt-0.5">Confirm details — pay in seconds</p>
        </div>

        {/* Merged booking + contact */}
        <section
          aria-labelledby="booking-contact-heading"
          className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/70 border border-gray-100/80 p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 gap-y-3 mb-4">
            <h3 id="booking-contact-heading" className="text-sm font-bold text-gray-900">
              Booking &amp; contact
            </h3>
            <div className="flex items-center gap-2 ml-auto">
              {showLoginCta ? (
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Login</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setContactExpanded((e) => !e)}
                className="text-xs font-bold text-gray-700 rounded-lg border border-gray-200 px-2.5 py-1.5 hover:bg-gray-50"
              >
                {contactExpanded ? 'Done' : 'Edit'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 md:items-start">
            <div className="space-y-2.5 min-w-0">
              <p className="text-sm text-gray-800 leading-snug flex gap-2">
                <span className="shrink-0" aria-hidden>
                  📍
                </span>
                <span>{addressLine}</span>
              </p>
              <p className="text-sm text-gray-800 leading-snug flex gap-2">
                <span className="shrink-0" aria-hidden>
                  🧹
                </span>
                <span>{serviceTitle}</span>
              </p>
              <p className="text-sm text-gray-800 leading-snug flex gap-2">
                <span className="shrink-0" aria-hidden>
                  📅
                </span>
                <span>{summaryDateTime}</span>
              </p>
              <p className="text-sm text-gray-800 leading-snug flex gap-2">
                <span className="shrink-0" aria-hidden>
                  👤
                </span>
                <span>{cleanerLine}</span>
              </p>
              <p className="text-sm text-gray-800 leading-snug flex gap-2">
                <span className="shrink-0" aria-hidden>
                  ⏱
                </span>
                <span>
                  Working hours: <span className="font-semibold">{workHoursLabel}</span>
                </span>
              </p>
            </div>

            <div className="min-w-0 border-t border-gray-100 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-8 md:border-gray-100">
              <AnimatePresence initial={false} mode="wait">
                {contactExpanded ? (
                  <motion.div
                    key="contact-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    <p className="text-[11px] text-gray-500 mb-1">
                      Email is required for payment receipt, confirmation and updates
                    </p>
                    <FieldInput
                      id="checkout-name"
                      label="Full name"
                      type="text"
                      placeholder="Your name"
                      value={data.name}
                      onChange={handleFieldChange('name')}
                      autoComplete="name"
                    />
                    <FieldInput
                      id="phone"
                      label="Phone"
                      type="tel"
                      placeholder="+27 82 000 0000"
                      value={data.phone}
                      onChange={handleFieldChange('phone')}
                      error={errors.phone}
                      autoComplete="tel"
                    />
                    <FieldInput
                      id="email"
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      value={data.email}
                      onChange={handleFieldChange('email')}
                      error={errors.email}
                      autoComplete="email"
                    />
                    <FieldInput
                      id="checkout-address"
                      label="Service address"
                      type="text"
                      placeholder="Street, suburb"
                      value={data.address}
                      onChange={handleFieldChange('address')}
                      autoComplete="street-address"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="contact-summary"
                    initial={{ opacity: 0.95 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-3 space-y-2.5 text-sm"
                  >
                    <div className="flex gap-2 min-w-0">
                      <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name</p>
                        <p className="text-gray-800 break-words">{data.name.trim() || '—'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 min-w-0">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Phone</p>
                        <p className="text-gray-800 break-words">{data.phone.trim() || '—'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 min-w-0">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</p>
                        <p className="text-gray-800 text-xs break-all">
                          {data.email.trim() || accountEmail || '—'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-medium text-emerald-800/90 flex items-start gap-2">
              <span className="text-emerald-600 shrink-0" aria-hidden>
                ✔
              </span>
              <span>Your time is reserved</span>
            </p>
            <p className="text-xs font-medium text-emerald-800/90 flex items-start gap-2">
              <span className="text-emerald-600 shrink-0" aria-hidden>
                ✔
              </span>
              <span>Cleaner assigned after booking</span>
            </p>
          </div>
        </section>

        <MainColumnPriceAndCta
          totalZar={totalZar}
          isProcessing={isProcessing}
          shaking={shaking}
          onPay={handleSubmit}
        />

        {/* Bottom trust strip — desktop; mobile uses fixed bar */}
        <div className="hidden lg:flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-3 border-t border-gray-100">
          {['SSL Encrypted', 'Free Cancellation', 'Satisfaction Guaranteed'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] text-gray-500">{item}</span>
            </div>
          ))}
        </div>
      </BookingFlowLayout>

      <div className="lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_32px_rgba(0,0,0,0.08)]">
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-2.5 pb-1 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[11px] text-gray-500 font-medium truncate">
                  {serviceTitle} · {shortDateLabel}
                </p>
                {data.promoCode && (
                  <p className="text-[11px] font-semibold text-primary truncate">
                    {(appliedPromo?.label ?? data.promoCode) + ' applied'}
                  </p>
                )}
              </div>
              <motion.p
                key={totalZar}
                initial={{ y: -4, opacity: 0.6 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-base font-bold text-gray-900 tabular-nums flex-shrink-0"
              >
                {formatZarSimple(totalZar)}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="px-4 pt-1 pb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-gray-50">
          {['SSL Encrypted', 'Free Cancellation', 'Satisfaction Guaranteed'].map((item) => (
            <div key={item} className="flex items-center gap-1">
              <Check className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-[10px] text-gray-500">{item}</span>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-center text-[10px] text-gray-400">Secure checkout via Paystack</p>
        </div>
      </div>

      <StickyCTA
        title="Ready to confirm your booking?"
        subtitle={hasContactErrors && !isProcessing ? 'Check your phone and email fields' : 'Limited slots available today'}
        totalLabel={formatZarSimple(totalZar)}
        buttonLabel={isProcessing ? 'Processing…' : 'Pay securely'}
        onClick={handleSubmit}
        disabled={isProcessing}
        urgencyText={!isProcessing ? 'Your selected slot is being held briefly' : undefined}
        helperText="Trusted by 100+ homes in Cape Town"
        className="lg:hidden"
      />
    </div>
  );
}

export { BookingStep4Confirmation as BookingConfirmationForm };
