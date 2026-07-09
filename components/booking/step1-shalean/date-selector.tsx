'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

function addDaysYmd(baseYmd: string, days: number): string {
  const d = new Date(`${baseYmd}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type DateSelectorProps = {
  selectedDate: string;
  onSelectDate: (ymd: string) => void;
  /** Number of days to show starting from today */
  count?: number;
};

export function DateSelector({ selectedDate, onSelectDate, count = 10 }: DateSelectorProps) {
  const days = useMemo(() => {
    const start = todayYmd();
    return Array.from({ length: count }, (_, i) => addDaysYmd(start, i));
  }, [count]);

  return (
    <div className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2">
        {days.map((ymd, idx) => {
          const d = new Date(`${ymd}T12:00:00`);
          const label = d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
          const sel = selectedDate === ymd;
          return (
            <button
              key={ymd}
              type="button"
              onClick={() => onSelectDate(ymd)}
              className={cn(
                'min-w-[5.5rem] shrink-0 rounded-2xl border px-3 py-2.5 text-left text-xs font-semibold transition-all sm:min-w-[6.5rem] sm:px-4 sm:py-3 sm:text-sm',
                sel
                  ? 'border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-violet-300',
              )}
            >
              <span className="block text-[10px] font-medium uppercase tracking-wide opacity-80">{idx === 0 ? 'Today' : ''}</span>
              <span className="mt-0.5 block leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
