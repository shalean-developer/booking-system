'use client';

import { ArrowRight } from 'lucide-react';
import { BOOKING_TIME_SLOT_DEFS } from '@/lib/booking-time-slots';

function slotLabel(slotId: string): string {
  return BOOKING_TIME_SLOT_DEFS.find((d) => d.id === slotId)?.label ?? slotId;
}

export default function StickyBookingBar({
  selectedTime,
  total,
  onContinue,
  canContinue = true,
}: {
  selectedTime: string | null;
  total: number;
  onContinue: () => void;
  canContinue?: boolean;
}) {
  if (!selectedTime) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 flex justify-between items-center gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{slotLabel(selectedTime)}</p>
        <p className="text-xs text-gray-500">Total: R{total.toLocaleString('en-ZA')}</p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className={[
          'shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-colors',
          canContinue
            ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed',
        ].join(' ')}
      >
        Continue
        <ArrowRight size={16} className="opacity-90" aria-hidden />
      </button>
    </div>
  );
}
