'use client';

import { ArrowRight } from 'lucide-react';
import { BOOKING_TIME_SLOT_DEFS } from '@/lib/booking-time-slots';

function slotLabel(slotId: string): string {
  return BOOKING_TIME_SLOT_DEFS.find((d) => d.id === slotId)?.label ?? slotId;
}

export default function StickyBookingBar({
  selectedTime,
  selectedTimeLabel,
  total,
  onContinue,
  canContinue = true,
  continueLabel = 'Continue to details',
  showTrust = true,
}: {
  selectedTime: string | null;
  /** When set (e.g. unified range "07:00 – 11:30"), shown instead of catalog label. */
  selectedTimeLabel?: string | null;
  total: number;
  onContinue: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  showTrust?: boolean;
}) {
  if (!selectedTime) return null;

  const displayLabel = selectedTimeLabel?.trim() || slotLabel(selectedTime);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="px-4 pt-3 flex justify-between items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{displayLabel}</p>
          <p className="text-xs text-muted-foreground">
            R{total.toLocaleString('en-ZA')}
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={[
            'shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-1.5 transition-colors',
            canContinue
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          ].join(' ')}
        >
          {continueLabel}
          <ArrowRight size={16} className="opacity-90" aria-hidden />
        </button>
      </div>
      {showTrust ? (
        <p className="px-4 pb-3 pt-1 text-[10px] text-muted-foreground text-center">
          ✓ No payment now · ✓ Free cancellation
        </p>
      ) : null}
    </div>
  );
}
