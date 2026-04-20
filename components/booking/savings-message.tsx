'use client';

import { cn } from '@/lib/utils';

export type SavingsMessageProps =
  | {
      variant: 'basic';
      /** Minutes per add-on line (from `extra_time_hours`). */
      extraTimeMinutes?: number;
      /** @deprecated Quick Clean V3 — unused; kept for call-site compatibility. */
      hours?: number | null;
      rateUsed?: number;
      isExtrasFullDayBundle?: boolean;
    }
  | { variant: 'premium' };

/**
 * Quick Clean (time-based labour) vs Premium copy.
 */
export function SavingsMessage(props: SavingsMessageProps) {
  if (props.variant === 'premium') {
    return (
      <div
        className={cn(
          'mb-3 rounded-lg border border-violet-100 bg-violet-50/90 px-3 py-2 text-[11px] font-medium text-violet-900'
        )}
        role="status"
      >
        Same hourly rate · team finish
      </div>
    );
  }

  return (
    <p className="mt-2 text-[11px] font-medium text-violet-800" role="note">
      Add-ons add time (max 6h)
    </p>
  );
}
