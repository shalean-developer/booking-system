'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { StickyCTA } from '@/components/booking/mobile/sticky-cta';

/** Props passed through from `BookingSystem` for parity with the full checkout screen (optional UI wiring). */
type BookingStep4WizardPassthroughProps = {
  errors?: Partial<Record<keyof BookingFormData, string>>;
  setErrors?: React.Dispatch<React.SetStateAction<Partial<Record<keyof BookingFormData, string>>>>;
  unpaidDuplicateBookingId?: string | null;
  onPayExistingUnpaidBooking?: () => void | Promise<void>;
  onCancelUnpaidDuplicate?: () => void | Promise<void>;
  duplicateUnpaidAction?: 'idle' | 'pay' | 'cancel';
  numberOfCleaners?: number;
  workHoursLabel?: string;
  selectedCleaner?: {
    name: string;
    photoUrl: string | null;
    rating: number;
    reviewCount: number;
  } | null;
  shortDateLabel?: string;
  accountEmail?: string | null;
  showLoyaltyBlock?: boolean;
  loyaltyBalance?: number;
  applyLoyaltyPoints?: boolean;
  onApplyLoyaltyPointsChange?: (v: boolean) => void;
  useLoyaltyPointsInput?: number;
  onUseLoyaltyPointsInputChange?: (v: number) => void;
  pricingLoading?: boolean;
};

export interface BookingStep4ConfirmationProps extends BookingStep4WizardPassthroughProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  paymentError: string;
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoError: string;
  setPromoError: (v: string) => void;
  onApplyPromo: () => void;
  onBack?: () => void;
  onFinalize: () => void;
  isProcessing: boolean;
  showLoginCta: boolean;
  onLogin: () => void;
  serviceTitle: string;
  summaryDateTime: string;
  addressLine: string;
  totalZar: number;
  discountAmount: number;
  appliedPromoCode: string;
  checkoutPriceReady?: boolean;
  /** When true, Pay is disabled (in-flight / already-paid / active Paystack link from server). */
  checkoutPayBlocked?: boolean;
}

function formatZarSimple(price: number) {
  return `R ${Math.round(price).toLocaleString('en-ZA')}`;
}

function TipButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-[44px] flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
        active ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      )}
    >
      {label}
    </button>
  );
}

export function BookingStep4CheckoutSingle({
  data,
  setData,
  paymentError,
  promoInput,
  setPromoInput,
  promoError,
  setPromoError,
  onApplyPromo,
  onFinalize,
  isProcessing,
  showLoginCta,
  onLogin,
  serviceTitle,
  summaryDateTime,
  addressLine: _addressLineProp,
  totalZar,
  discountAmount,
  appliedPromoCode,
  checkoutPriceReady = true,
  checkoutPayBlocked = false,
  errors: _errors,
  setErrors: _setErrors,
  unpaidDuplicateBookingId: _unpaidDuplicateBookingId,
  onPayExistingUnpaidBooking: _onPayExistingUnpaidBooking,
  onCancelUnpaidDuplicate: _onCancelUnpaidDuplicate,
  duplicateUnpaidAction: _duplicateUnpaidAction,
  numberOfCleaners: _numberOfCleaners,
  workHoursLabel: _workHoursLabel,
  selectedCleaner: _selectedCleaner,
  shortDateLabel: _shortDateLabel,
  accountEmail: _accountEmail,
  showLoyaltyBlock: _showLoyaltyBlock,
  loyaltyBalance: _loyaltyBalance,
  applyLoyaltyPoints: _applyLoyaltyPoints,
  onApplyLoyaltyPointsChange: _onApplyLoyaltyPointsChange,
  useLoyaltyPointsInput: _useLoyaltyPointsInput,
  onUseLoyaltyPointsInputChange: _onUseLoyaltyPointsInputChange,
  pricingLoading: _pricingLoading,
}: BookingStep4ConfirmationProps) {
  const [promoSuccess, setPromoSuccess] = useState('');
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [customTipOpen, setCustomTipOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [customTip, setCustomTip] = useState('');

  useEffect(() => {
    if (appliedPromoCode && !promoError) setPromoSuccess('Promo applied!');
    else setPromoSuccess('');
  }, [appliedPromoCode, promoError]);

  useEffect(() => {
    if (data.promoCode) setPromoOpen(true);
  }, [data.promoCode]);

  const baseAndFeesTotal = Math.max(0, totalZar - data.tipAmount + discountAmount);
  const basePrice = Math.round(baseAndFeesTotal * 0.82);
  const extrasPrice = Math.round(baseAndFeesTotal * 0.1);
  const serviceFee = Math.round(baseAndFeesTotal * 0.06);
  const surge = Math.max(0, baseAndFeesTotal - (basePrice + extrasPrice + serviceFee));
  const finalTotal = basePrice + extrasPrice + serviceFee + surge + data.tipAmount - discountAmount;

  const baseCombined = basePrice + serviceFee + surge;

  const bookingOneLiner = useMemo(() => {
    const parts = [serviceTitle?.trim(), summaryDateTime?.trim()].filter(Boolean);
    return parts.join(' · ');
  }, [serviceTitle, summaryDateTime]);

  const payLabel =
    checkoutPayBlocked ? 'Pay unavailable' : checkoutPriceReady ? `Pay ${formatZarSimple(finalTotal)}` : 'Pay —';
  const trustLine = '✓ Secure payment · ✓ No hidden fees';

  const payDisabled = isProcessing || !checkoutPriceReady || checkoutPayBlocked;

  const footerLogin =
    showLoginCta ? (
      <p className="text-center text-[11px] text-gray-500">
        <button type="button" onClick={onLogin} className="font-medium text-violet-600 hover:text-violet-800 hover:underline">
          Login for faster checkout
        </button>
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans pb-32 lg:pb-10">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
          <h1 className="text-base font-bold text-gray-900">Pay</h1>
          <BookingFlowStepIndicator activeStep={4} stepHint="Almost done" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-4 px-4 pt-4">
        {paymentError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{paymentError}</div>
        ) : null}

        <p className="text-center text-sm font-medium text-gray-800">{bookingOneLiner || 'Your booking'}</p>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-center text-lg font-bold text-gray-900">
            Total: {checkoutPriceReady ? formatZarSimple(finalTotal) : '—'}
          </p>
          <button
            type="button"
            onClick={() => setBreakdownOpen((v) => !v)}
            className="mx-auto mt-2 block text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            {breakdownOpen ? 'Hide breakdown' : 'View breakdown →'}
          </button>
          {breakdownOpen ? (
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-700">
              <Row label="Base" value={formatZarSimple(baseCombined)} />
              <Row label="Extras" value={formatZarSimple(extrasPrice)} />
              <Row label="Tip" value={formatZarSimple(data.tipAmount)} />
              <Row label="Discount" value={discountAmount > 0 ? `-${formatZarSimple(discountAmount)}` : formatZarSimple(0)} />
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Tip (optional)</p>
          <div className="mt-3 flex gap-2">
            <TipButton label="R20" active={data.tipAmount === 20} onClick={() => setData((p) => ({ ...p, tipAmount: 20 }))} />
            <TipButton label="R50" active={data.tipAmount === 50} onClick={() => setData((p) => ({ ...p, tipAmount: 50 }))} />
            <TipButton label="R100" active={data.tipAmount === 100} onClick={() => setData((p) => ({ ...p, tipAmount: 100 }))} />
          </div>
          {!customTipOpen ? (
            <button
              type="button"
              onClick={() => setCustomTipOpen(true)}
              className="mt-3 text-sm font-semibold text-violet-600 hover:text-violet-800"
            >
              Custom amount →
            </button>
          ) : (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                placeholder="Amount (ZAR)"
                inputMode="decimal"
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
              <button
                type="button"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => setData((p) => ({ ...p, tipAmount: Math.max(0, Math.round(Number(customTip) || 0)) }))}
              >
                Apply
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {data.promoCode ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-emerald-900">{data.promoCode}</p>
                {discountAmount > 0 ? <p className="text-xs text-emerald-800">-{formatZarSimple(discountAmount)}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setData((p) => ({ ...p, promoCode: '' }));
                  setPromoSuccess('');
                  setPromoError('');
                  setPromoOpen(false);
                }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : promoOpen ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  setPromoError('');
                }}
                placeholder="Code"
                className={cn(
                  'min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100',
                  promoError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                )}
              />
              <button
                type="button"
                onClick={() => {
                  setPromoSuccess('');
                  onApplyPromo();
                }}
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Apply
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPromoOpen(true)}
              className="text-sm font-semibold text-violet-600 hover:text-violet-800"
            >
              Have a promo code?
            </button>
          )}
          {promoError ? <p className="mt-2 text-xs text-red-600">{promoError}</p> : null}
          {promoSuccess ? <p className="mt-2 text-xs text-emerald-700">{promoSuccess}</p> : null}
        </section>

        <div className="hidden lg:block space-y-3">
          <button
            type="button"
            onClick={onFinalize}
            disabled={payDisabled}
            className={cn(
              'w-full rounded-2xl py-4 text-base font-bold text-white shadow-md transition-colors',
              payDisabled ? 'cursor-not-allowed bg-gray-300' : 'bg-violet-600 hover:bg-violet-700 active:scale-[0.99]'
            )}
          >
            {isProcessing ? 'Processing…' : payLabel}
          </button>
          <p className="text-center text-xs text-gray-500">{trustLine}</p>
          {checkoutPayBlocked ? (
            <p className="text-center text-xs text-amber-800">
              A payment is already in progress or this booking is paid. Complete checkout in your other tab or open{' '}
              <Link href="/payment/status" className="font-medium text-violet-700 underline-offset-2 hover:underline">
                payment status
              </Link>{' '}
              — paying again could duplicate the charge.
            </p>
          ) : null}
          {footerLogin}
        </div>
      </div>

      <StickyCTA
        className="lg:hidden"
        buttonLabel={isProcessing ? 'Processing…' : payLabel}
        onClick={onFinalize}
        disabled={payDisabled}
        helperText={trustLine}
        footerSlot={footerLogin}
        showCtaArrow={false}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
