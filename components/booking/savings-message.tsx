'use client';

import { cn } from '@/lib/utils';
import { computeBasicTierSavingsZar, getBasicHourlyRate } from '@/lib/pricing-engine-v2';

export type SavingsMessageProps =
  | {
      variant: 'basic';
      /** Planned hours (2–5, or 8 with extras bundle); null before selection. */
      hours: number | null;
      /** Tier rate in cents/h from engine, or omit to derive from `hours`. */
      rateUsed?: number;
      /** Basic + add-ons: fixed 8h R450 bundle — hide tier nudges. */
      isExtrasFullDayBundle?: boolean;
    }
  | { variant: 'premium' };

/**
 * Tier-aware savings and nudges (Basic) vs efficiency copy (Premium).
 * Basic: educational line + dynamic savings + optional “add 1 hour” nudge.
 */
export function SavingsMessage(props: SavingsMessageProps) {
  if (props.variant === 'premium') {
    return (
      <div
        className={cn(
          'mb-3 rounded-lg border border-violet-100 bg-violet-50/90 p-2.5 text-xs leading-snug text-violet-900'
        )}
        role="status"
      >
        <span aria-hidden>✨ </span>
        Larger jobs are priced more efficiently
      </div>
    );
  }

  const { hours, rateUsed: rateUsedProp, isExtrasFullDayBundle } = props;
  if (isExtrasFullDayBundle) {
    return (
      <div className="mt-2 rounded-lg border border-violet-100 bg-violet-50/90 p-2.5 text-xs leading-snug text-violet-900">
        <span aria-hidden>💡 </span>
        Add-ons are priced as one full-day Quick Clean bundle (fixed total incl. service fee).
      </div>
    );
  }

  const rateUsed =
    rateUsedProp ??
    (hours != null ? getBasicHourlyRate(hours) : undefined);

  const savingsZar =
    hours != null && rateUsed != null
      ? computeBasicTierSavingsZar(hours, rateUsed)
      : 0;

  const showSavings = hours != null && hours > 3 && savingsZar > 0;
  const showNudge = hours === 3 || hours === 4;

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-gray-500 leading-snug">
        <span aria-hidden>💡 </span>
        The more hours you book, the lower your hourly rate
      </p>

      {showSavings ? (
        <div
          className="rounded-lg border border-emerald-100 bg-emerald-50/95 p-2.5 text-xs font-medium text-emerald-900"
          role="status"
        >
          <span aria-hidden>🎉 </span>
          {`You're saving R${savingsZar.toLocaleString('en-ZA')} by booking ${hours} hours`}
        </div>
      ) : null}

      {showNudge ? (
        <div className="rounded-lg border border-purple-100 bg-purple-50 p-2.5 text-xs text-purple-900 leading-snug">
          <span aria-hidden>💡 </span>
          Add 1 more hour to save even more per hour
        </div>
      ) : null}
    </div>
  );
}
