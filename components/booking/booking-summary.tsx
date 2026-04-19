'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingFormData } from '@/components/booking-system-types';
import { TipCard } from '@/components/booking/tip-card';

function formatZarSimple(price: number) {
  return `R ${price.toLocaleString('en-ZA')}`;
}

export type BookingSummaryRow = { id: string; label: string; value: string };

const summaryShellClass =
  'w-full max-w-[340px] lg:max-w-[360px] xl:max-w-[380px] ml-auto flex flex-col gap-4 transition-all duration-300 ease-in-out';

const shellMotion = 'transition-all duration-300 ease-in-out';

export type BookingSummaryProps =
  | {
      mode: 'preview';
      step: 1 | 2 | 3;
      serviceTitle: string;
      /** Property / space summary — shown from step ≥ 2 */
      propertySummary?: string;
      /** Extras / add-ons summary — shown from step ≥ 3 */
      extrasSummary?: string;
      /** Live total (same source as checkout). */
      totalZar: number;
      /** @deprecated Ignored — kept for call-site compatibility. */
      previewPricingMode?: 'default' | 'optimized';
      /** Extra line items (e.g. date, crew) — shown from step ≥ 3 */
      detailRows?: BookingSummaryRow[];
      /** Rich breakdown (step 1 DB rows, step 2 addon lines, etc.) */
      details?: React.ReactNode;
      /** CTA, trust, help */
      footer?: React.ReactNode;
      /** Secondary card below main summary (e.g. “Your selection” on step 2) */
      after?: React.ReactNode;
      /** Optional duration / team (engine meta) — shown under the explainer. */
      pricingContext?: { estimatedJobHours?: number; teamSize?: number } | null;
      /** Basic = short copy; Premium = full engine explanation */
      summaryTone?: 'basic' | 'premium';
      /** Step 1 premium — price anchoring above the total (conversion). */
      previewAnchor?: string;
    }
  | {
      mode: 'full';
      step?: 4;
      data: BookingFormData;
      setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
      summaryRows: BookingSummaryRow[];
      totalZar: number;
      discountAmount: number;
      cleanerLabel: string;
      cleanerPhotoUrl?: string | null;
      isProcessing: boolean;
      shaking: boolean;
      onFinalize: () => void;
      promoInput: string;
      setPromoInput: (v: string) => void;
      promoError: string;
      setPromoError: (v: string) => void;
      onApplyPromo: () => void;
      onRemovePromo: () => void;
      promoSuccess?: string;
      appliedPromoLabel?: string | null;
      /** Engine-aligned line items (same as steps 1–3). */
      enginePriceRows?: { id: string; label: string; value: number }[];
      pricingContext?: { estimatedJobHours?: number; teamSize?: number } | null;
    };

export function BookingSummary(props: BookingSummaryProps) {
  if (props.mode === 'preview') {
    const {
      step,
      serviceTitle,
      propertySummary,
      extrasSummary,
      totalZar,
      previewPricingMode: _previewPricingMode = 'default',
      detailRows = [],
      details,
      footer,
      after,
      pricingContext = null,
      summaryTone = 'premium',
      previewAnchor,
    } = props;

    const displayTotal = totalZar;

    const showProperty = step >= 2;
    const showExtras = step >= 3;
    const showDetailRows = step >= 3;

    return (
      <aside aria-label="Booking summary" className={summaryShellClass}>
        <div className={cn('rounded-2xl overflow-hidden shadow-md border border-violet-500/20', shellMotion)}>
          <div className="bg-gradient-to-br from-violet-600 to-violet-800 px-5 py-5">
            {previewAnchor ? (
              <p className="text-violet-100/95 text-xs font-medium leading-snug mb-2 border-b border-white/10 pb-2">
                {previewAnchor}
              </p>
            ) : null}
            <p className="text-violet-200 text-xs font-semibold tracking-widest uppercase mb-1">Total Price</p>
            <motion.p
              key={displayTotal}
              initial={{ scale: 1.04, opacity: 0.85 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="text-4xl font-extrabold text-white tracking-tight"
            >
              {displayTotal > 0 ? formatZarSimple(displayTotal) : '—'}
            </motion.p>
            <p className="text-violet-200/90 text-[11px] mt-2 leading-snug max-w-[320px]">
              {summaryTone === 'basic'
                ? 'Tiered rates (min R250). Estimated price includes booking cover; then a fixed service fee. No heavy add-ons on Basic.'
                : 'This price is based on estimated cleaning time, team size, and service requirements. Estimated price includes booking cover, plus a fixed service fee.'}
            </p>
            {pricingContext &&
            (pricingContext.estimatedJobHours != null || pricingContext.teamSize != null) ? (
              <p className="text-violet-200/85 text-[11px] mt-1.5 leading-snug max-w-[320px]">
                {pricingContext.estimatedJobHours != null && pricingContext.estimatedJobHours > 0 ? (
                  <span className="block">
                    Estimated duration: {pricingContext.estimatedJobHours.toFixed(1)} hours
                  </span>
                ) : null}
                {pricingContext.teamSize != null && pricingContext.teamSize > 0 ? (
                  <span className="block">Team size: {pricingContext.teamSize} cleaners</span>
                ) : null}
              </p>
            ) : null}
            <p className="text-violet-300 text-sm mt-2 font-medium line-clamp-2">{serviceTitle || 'Select a service'}</p>
          </div>

          <div className="bg-white px-5 py-4 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              <motion.div
                key="row-service"
                layout
                initial={false}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex justify-between items-start gap-3 text-sm"
              >
                <span className="text-gray-500 shrink-0">Service</span>
                <span className="text-right font-medium text-gray-900 max-w-[60%] break-words">{serviceTitle}</span>
              </motion.div>

              {showProperty && (
                <motion.div
                  key="row-property"
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex justify-between items-start gap-3 text-sm"
                >
                  <span className="text-gray-500 shrink-0">Property</span>
                  <span className="text-right font-medium text-gray-900 max-w-[60%] break-words">
                    {propertySummary?.trim() ? propertySummary : '—'}
                  </span>
                </motion.div>
              )}

              {showExtras && (
                <motion.div
                  key="row-extras"
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex justify-between items-start gap-3 text-sm"
                >
                  <span className="text-gray-500 shrink-0">Extras</span>
                  <span className="text-right font-medium text-gray-900 max-w-[60%] break-words">
                    {extrasSummary?.trim() ? extrasSummary : '—'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {showDetailRows && detailRows.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-gray-100">
                {detailRows.map((row) => (
                  <div key={row.id} className="flex justify-between items-start gap-3 text-sm text-gray-600">
                    <span className="shrink-0">{row.label}</span>
                    <span className="text-right font-semibold text-gray-800 max-w-[60%] break-words">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {details ? <div className={cn('space-y-3 pt-1 border-t border-gray-100', shellMotion)}>{details}</div> : null}

            {displayTotal > 0 && (
              <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-bold text-gray-900">
                <span>Total Price</span>
                <motion.span
                  key={displayTotal}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="tabular-nums"
                >
                  {formatZarSimple(displayTotal)}
                </motion.span>
              </div>
            )}
            {footer ? <div className={shellMotion}>{footer}</div> : null}
          </div>
        </div>

        {after ? <div className={shellMotion}>{after}</div> : null}
      </aside>
    );
  }

  const {
    data,
    setData,
    summaryRows,
    totalZar,
    discountAmount,
    cleanerLabel,
    cleanerPhotoUrl = null,
    isProcessing,
    shaking,
    onFinalize,
    promoInput,
    setPromoInput,
    promoError,
    setPromoError,
    onApplyPromo,
    onRemovePromo,
    promoSuccess = '',
    appliedPromoLabel = null,
    enginePriceRows,
    pricingContext: fullPricingContext = null,
  } = props;

  return (
    <aside aria-label="Booking summary" className={summaryShellClass}>
      <TipCard
        cleanerName={cleanerLabel}
        cleanerPhotoUrl={cleanerPhotoUrl}
        isTeam={cleanerLabel.toLowerCase().includes('team')}
        tipAmount={data.tipAmount}
        onTipChange={(value) => setData((p) => ({ ...p, tipAmount: value }))}
        disabled={isProcessing}
      />

      <div
        className={cn(
          'rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white flex flex-col',
          shellMotion
        )}
      >
        <div className="bg-white p-3 flex flex-col space-y-3">
          {summaryRows.map((row) => (
            <div key={row.id} className="flex justify-between items-start gap-3 text-sm">
              <span className="text-gray-500 shrink-0">{row.label}</span>
              <motion.span
                key={`${row.id}-${row.value}`}
                initial={{ opacity: 0.5, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-right font-medium text-gray-900 max-w-[55%] break-words"
              >
                {row.value}
              </motion.span>
            </div>
          ))}

          {enginePriceRows && enginePriceRows.length > 0 ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50/90 p-2.5 space-y-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Price breakdown</p>
              {enginePriceRows
                .filter((r) => r.value !== 0)
                .map((row) => (
                  <div key={row.id} className="flex justify-between items-start gap-2 text-xs">
                    <span className="text-gray-600 shrink-0">{row.label}</span>
                    <span className="font-semibold text-gray-900 tabular-nums text-right">{formatZarSimple(row.value)}</span>
                  </div>
                ))}
              <p className="text-[10px] text-gray-500 leading-snug pt-0.5 border-t border-gray-100 mt-1">
                This price is based on estimated cleaning time, team size, and service requirements. It includes
                cleaner pay, booking cover, and service costs.
              </p>
              {fullPricingContext &&
              (fullPricingContext.estimatedJobHours != null || fullPricingContext.teamSize != null) ? (
                <p className="text-[10px] text-gray-500">
                  {fullPricingContext.estimatedJobHours != null && fullPricingContext.estimatedJobHours > 0 ? (
                    <span className="block">
                      Estimated duration: {fullPricingContext.estimatedJobHours.toFixed(1)} hours
                    </span>
                  ) : null}
                  {fullPricingContext.teamSize != null && fullPricingContext.teamSize > 0 ? (
                    <span className="block">Team size: {fullPricingContext.teamSize} cleaners</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="border-t border-gray-100 pt-2 mt-0.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Promo code</p>
            {data.promoCode ? (
              <div className="flex items-start justify-between gap-2 rounded-lg border border-green-200 bg-green-50/90 px-2 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-green-800 leading-tight">
                    <span className="font-mono tracking-wide">{data.promoCode}</span>
                    {appliedPromoLabel ? (
                      <span className="font-semibold text-green-700 ml-1">· {appliedPromoLabel}</span>
                    ) : null}
                  </p>
                  {discountAmount > 0 && (
                    <p className="text-[11px] font-semibold text-green-600 mt-0.5">
                      −{formatZarSimple(discountAmount)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onRemovePromo}
                  disabled={isProcessing}
                  className="text-[10px] font-semibold text-gray-500 hover:text-red-600 shrink-0 pt-0.5 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    id="booking-summary-promo"
                    autoComplete="off"
                    placeholder="Enter code"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && onApplyPromo()}
                    disabled={isProcessing}
                    className={cn(
                      'min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 bg-white outline-none font-mono tracking-wide uppercase',
                      'focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30',
                      promoError ? 'border-red-400 bg-red-50' : 'border-gray-200',
                      isProcessing && 'opacity-50 cursor-not-allowed'
                    )}
                  />
                  <button
                    type="button"
                    onClick={onApplyPromo}
                    disabled={isProcessing}
                    className="shrink-0 rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                <AnimatePresence>
                  {promoError ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[10px] text-red-600 flex items-center gap-0.5"
                    >
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {promoError}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
                {promoSuccess ? (
                  <p className="text-[10px] text-green-600 font-medium leading-snug">{promoSuccess}</p>
                ) : null}
              </div>
            )}
          </div>

          <AnimatePresence>
            {data.tipAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex justify-between items-start gap-3 text-sm">
                  <span className="text-gray-500 shrink-0">Tip</span>
                  <span className="text-right font-medium text-green-700 max-w-[55%]">
                    +{formatZarSimple(data.tipAmount)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-gray-100 flex-shrink-0" />

        <div className="p-3 flex justify-between items-start gap-3 bg-gray-50/80">
          <span className="text-sm font-bold text-gray-900 shrink-0">Total Price</span>
          <motion.span
            key={totalZar}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="text-base font-extrabold text-violet-700 tabular-nums text-right max-w-[55%]"
          >
            {formatZarSimple(totalZar)}
          </motion.span>
        </div>

        <div className="flex-shrink-0 p-3 pt-0 border-t border-gray-100 bg-white">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={shaking ? { duration: 0.5 } : {}}
            onClick={onFinalize}
            disabled={isProcessing}
            className={cn(
              'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ease-in-out',
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

      <div className={cn('flex flex-col gap-2 px-0.5', shellMotion)}>
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
  );
}
