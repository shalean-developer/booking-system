'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingFormData } from '@/components/booking-system-types';
import { TipCard } from '@/components/booking/tip-card';

function formatZarSimple(price: number) {
  return `R ${price.toLocaleString('en-ZA')}`;
}

/** Hero price line — compact “R4 999” style for the anchor block */
function formatZarHero(price: number) {
  return `R${price.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
}

function defaultPriceSubline(
  pricingContext: { estimatedJobHours?: number; teamSize?: number } | null | undefined
): string | null {
  if (!pricingContext) return null;
  const parts: string[] = [];
  if (
    pricingContext.estimatedJobHours != null &&
    pricingContext.estimatedJobHours > 0
  ) {
    parts.push(`${pricingContext.estimatedJobHours.toFixed(1)}h`);
  }
  if (pricingContext.teamSize != null && pricingContext.teamSize > 0) {
    parts.push(
      `${pricingContext.teamSize} ${pricingContext.teamSize === 1 ? 'cleaner' : 'cleaners'}`
    );
  }
  return parts.length ? parts.join(' · ') : null;
}

const cardClass =
  'rounded-2xl bg-card border border-border/70 shadow-md shadow-black/[0.06]';

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
      /** Step 1 — short trust line under total (no hidden fees, cancellation). */
      priceReassurance?: boolean;
      /** SweepSouth-style rows: where / what / when — full strings, wrap-friendly */
      bookingDetails?: { where: string; what: string; when: string };
      /** Edit handlers for booking detail rows (row is keyboard-accessible). */
      onEditBookingDetail?: (key: 'where' | 'what' | 'when') => void;
      /** Override hours · cleaners line under price (else derived from pricingContext). */
      priceSubline?: string | null;
      /** Primary “find cleaner” action (e.g. same as continue on steps 2–3). */
      onFindCleaner?: () => void;
      findCleanerCtaDisabled?: boolean;
      /** Override CTA label (e.g. step 2 “Continue to details”). */
      primaryCtaLabel?: string;
      /** One line under the primary CTA (e.g. step 3 “Next: Confirm your booking”). */
      primaryCtaSubtext?: string | null;
      /** When set, show demand hints only if flags are true (future-ready). */
      areaDemandHint?: {
        areaLabel?: string;
        showPopular?: boolean;
        showFillsFast?: boolean;
      } | null;
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
      priceReassurance = false,
      bookingDetails: bookingDetailsProp,
      onEditBookingDetail,
      priceSubline: priceSublineProp,
      onFindCleaner,
      findCleanerCtaDisabled = false,
      primaryCtaLabel = 'Find my cleaner →',
      primaryCtaSubtext = null,
      areaDemandHint = null,
    } = props;

    const displayTotal = totalZar;
    const compactStep1 = step === 1;

    const showExtras = step >= 3;
    const showDetailRows = step >= 3;

    const resolvedSubline =
      priceSublineProp !== undefined
        ? priceSublineProp
        : defaultPriceSubline(pricingContext);

    const bookingDetails =
      bookingDetailsProp ??
      {
        where: propertySummary?.trim() || 'Add your address',
        what: serviceTitle || '—',
        when: step === 1 ? 'Next: date & time' : 'Choose date & time',
      };

    const trustStripInline = (
      <p className="text-[11px] font-medium text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="whitespace-nowrap">✓ No payment now</span>
        <span className="text-border/80 hidden sm:inline" aria-hidden>
          ·
        </span>
        <span className="whitespace-nowrap">✓ Free cancellation</span>
      </p>
    );

    const detailRow = (
      key: 'where' | 'what' | 'when',
      label: string,
      value: string,
      Icon: React.ComponentType<{ className?: string }>
    ) => {
      const editable = Boolean(onEditBookingDetail);
      const rowInner = (
        <>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              {editable ? (
                <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground" title={value}>
              {value}
            </p>
          </div>
        </>
      );
      if (editable) {
        return (
          <button
            key={key}
            type="button"
            onClick={() => onEditBookingDetail?.(key)}
            className="flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {rowInner}
          </button>
        );
      }
      return (
        <div key={key} className="flex w-full items-center gap-3 px-1 py-2.5">
          {rowInner}
        </div>
      );
    };

    const demandHintLines: string[] = [];
    if (
      areaDemandHint?.showPopular &&
      areaDemandHint.areaLabel?.trim()
    ) {
      demandHintLines.push(`Popular in ${areaDemandHint.areaLabel.trim()} today`);
    }
    if (areaDemandHint?.showFillsFast) {
      demandHintLines.push('Fills up fast');
    }

    const compactEstimateHours =
      pricingContext?.estimatedJobHours != null && Number.isFinite(pricingContext.estimatedJobHours)
        ? Number(pricingContext.estimatedJobHours).toFixed(1)
        : null;

    const estimateStrip = (
      <div className={cn(cardClass, 'overflow-hidden border-0 bg-gradient-to-r from-primary to-violet-600 text-white')}>
        <div className="flex items-stretch">
          <div className="w-1/2 px-4 py-3 text-center">
            <p className="text-2xl font-semibold tabular-nums">{compactEstimateHours ?? '—'}</p>
            <p className="text-sm font-semibold text-white">Est. hours</p>
          </div>
          <div className="w-1/2 border-l border-white/25 px-4 py-3 text-center">
            <motion.p
              key={displayTotal}
              initial={{ scale: 1.01, opacity: 0.94 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="text-2xl font-semibold tabular-nums"
            >
              {displayTotal > 0 ? formatZarHero(displayTotal) : '—'}
            </motion.p>
            <p className="text-sm font-semibold text-white">Est. Price</p>
          </div>
        </div>
      </div>
    );

    /** Step 2 — conversion-focused: price → CTA → trust → cleaner → plain summary */
    if (step === 2) {
      return (
        <aside aria-label="Booking summary" className={summaryShellClass}>
          <div className={cn('flex flex-col gap-3', shellMotion)}>
            <div className={cn(cardClass, 'p-4')}>
              <h3 className="text-sm font-bold text-foreground leading-tight">
                We&apos;ll match a cleaner for you
              </h3>
              <ul className="mt-2.5 space-y-1 text-[12px] font-medium text-foreground/90 list-disc pl-4 marker:text-primary">
                <li>97% satisfaction</li>
                <li>Trusted professionals</li>
              </ul>
              {onFindCleaner ? (
                <motion.button
                  type="button"
                  whileTap={{ scale: findCleanerCtaDisabled ? 1 : 0.98 }}
                  disabled={findCleanerCtaDisabled}
                  onClick={onFindCleaner}
                  className={cn(
                    'mt-3 flex w-full items-center justify-center rounded-xl border border-border bg-background py-2.5 text-sm font-bold transition-colors',
                    findCleanerCtaDisabled
                      ? 'cursor-not-allowed opacity-60'
                      : 'hover:bg-muted/60 text-foreground'
                  )}
                >
                  Let us choose →
                </motion.button>
              ) : null}
            </div>

            <div className={cn(cardClass, 'p-4')}>
              <h3 className="text-sm font-bold text-foreground mb-3">Your booking</h3>
              <div className="space-y-2.5 text-[13px] font-medium text-foreground leading-snug">
                <p className="break-words">{bookingDetails.where}</p>
                <p className="break-words">{bookingDetails.what}</p>
                <p className="break-words">{bookingDetails.when}</p>
              </div>
            </div>

            {estimateStrip}

            {onFindCleaner ? (
              <>
                <motion.button
                  type="button"
                  whileTap={{ scale: findCleanerCtaDisabled ? 1 : 0.98 }}
                  disabled={findCleanerCtaDisabled}
                  onClick={onFindCleaner}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-colors',
                    findCleanerCtaDisabled
                      ? 'cursor-not-allowed bg-muted text-muted-foreground'
                      : 'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90'
                  )}
                >
                  {primaryCtaLabel}
                </motion.button>
                <p className="mt-1 text-center text-[12px] font-medium text-muted-foreground">
                  Next: Confirm your booking
                </p>
                <div className="px-0.5">{trustStripInline}</div>
              </>
            ) : null}
          </div>
        </aside>
      );
    }

    return (
      <aside aria-label="Booking summary" className={summaryShellClass}>
        <div className={cn('flex flex-col gap-3', shellMotion)}>
          {!compactStep1 && previewAnchor ? (
            <p className="text-xs font-medium leading-snug text-muted-foreground">{previewAnchor}</p>
          ) : null}

          {/* 2 — Cleaner match + CTA + trust (conversion); hidden on step 3 — main column carries assignment UX */}
          {step !== 3 ? (
            <div className={cn(cardClass, 'p-4')}>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                  aria-hidden
                >
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground leading-tight">
                    We&apos;ll match the best cleaner
                  </h3>
                  <ul className="mt-2 space-y-1 text-[12px] font-medium text-foreground/85">
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      97% satisfaction
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      Trusted professionals
                    </li>
                  </ul>
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    Matched based on your home and needs
                  </p>
                </div>
              </div>

              {demandHintLines.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {demandHintLines.map((line) => (
                    <span
                      key={line}
                      className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200/80"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              ) : null}

              {onFindCleaner ? (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: findCleanerCtaDisabled ? 1 : 0.98 }}
                    disabled={findCleanerCtaDisabled}
                    onClick={onFindCleaner}
                    className={cn(
                      'mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
                      findCleanerCtaDisabled
                        ? 'cursor-not-allowed bg-muted text-muted-foreground'
                        : 'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90'
                    )}
                  >
                    {primaryCtaLabel}
                  </motion.button>
                  <div className="mt-3">{trustStripInline}</div>
                </>
              ) : (
                <div className="mt-4">{trustStripInline}</div>
              )}
            </div>
          ) : null}

          {/* 3 — Booking details (editable summary) */}
          <div className={cn(cardClass, 'p-4')}>
            <h3 className="text-sm font-bold text-foreground">Booking details</h3>
            <div className="mt-1 flex flex-col divide-y divide-border/80">
              {detailRow('where', 'Where', bookingDetails.where, MapPin)}
              {detailRow('what', 'What', bookingDetails.what, Sparkles)}
              {detailRow('when', 'When', bookingDetails.when, Clock)}
            </div>
            {showExtras && extrasSummary?.trim() ? (
              <p className="mt-2 border-t border-border/80 pt-2 text-[11px] text-muted-foreground truncate">
                <span className="font-semibold text-foreground">Add-ons: </span>
                {extrasSummary}
              </p>
            ) : null}
            {showDetailRows && detailRows.length > 0 && !bookingDetailsProp ? (
              <div className="mt-2 space-y-1.5 border-t border-border/80 pt-2">
                {detailRows.map((row) => (
                  <div key={row.id} className="flex justify-between gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 font-medium">{row.label}</span>
                    <span className="min-w-0 truncate text-right font-semibold text-foreground">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {estimateStrip}

          {/* Optional breakdown / rich details */}
          {details ? (
            <div className={cn(cardClass, 'p-4 space-y-3')}>
              {details}
            </div>
          ) : null}

          {footer ? (
            <div className={cn('flex flex-col gap-3', shellMotion)}>
              {footer}
              {!onFindCleaner && priceReassurance ? (
                <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">{trustStripInline}</div>
              ) : null}
            </div>
          ) : null}

          {step === 3 && onFindCleaner ? (
            <div className={cn(cardClass, 'p-4 space-y-3')}>
              <motion.button
                type="button"
                whileTap={{ scale: findCleanerCtaDisabled ? 1 : 0.98 }}
                disabled={findCleanerCtaDisabled}
                onClick={onFindCleaner}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-colors',
                  findCleanerCtaDisabled
                    ? 'cursor-not-allowed bg-muted text-muted-foreground'
                    : 'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90'
                )}
              >
                {primaryCtaLabel}
              </motion.button>
              {primaryCtaSubtext ? (
                <p className="text-center text-[12px] font-medium text-muted-foreground">{primaryCtaSubtext}</p>
              ) : null}
              <div>{trustStripInline}</div>
            </div>
          ) : null}
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
                    <span className="block">
                      Team size: {fullPricingContext.teamSize}{' '}
                      {fullPricingContext.teamSize === 1 ? 'cleaner' : 'cleaners'}
                    </span>
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
                      Discount applied: −{formatZarSimple(discountAmount)}
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
                      'focus:border-primary focus:ring-1 focus:ring-primary/30',
                      promoError ? 'border-red-400 bg-red-50' : 'border-gray-200',
                      isProcessing && 'opacity-50 cursor-not-allowed'
                    )}
                  />
                  <button
                    type="button"
                    onClick={onApplyPromo}
                    disabled={isProcessing}
                    className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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

        <div className="p-3 flex justify-between items-start gap-3 bg-muted/40">
          <span className="text-sm font-bold text-foreground shrink-0">Due now</span>
          <motion.span
            key={totalZar}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="text-base font-extrabold text-primary tabular-nums text-right max-w-[55%]"
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
                ? 'bg-primary/60 text-primary-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 cursor-pointer'
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
