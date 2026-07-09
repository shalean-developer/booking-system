'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type TimeSlotCardProps = {
  time: string;
  /** Full final price in ZAR (surge included). */
  priceZar: number;
  selected: boolean;
  onSelect: () => void;
  badge?: string | null;
  disabled?: boolean;
};

function formatZar(n: number) {
  return `R ${Math.round(n).toLocaleString('en-ZA')}`;
}

export function TimeSlotCard({ time, priceZar, selected, onSelect, badge, disabled }: TimeSlotCardProps) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-1 rounded-2xl border-2 bg-white px-4 py-3 text-left shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between',
        selected
          ? 'border-violet-600 shadow-md shadow-violet-500/20 ring-2 ring-violet-400/20'
          : 'border-gray-100 hover:border-violet-200 hover:shadow',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-bold text-gray-900">{time}</span>
        {badge ? <span className="text-xs font-medium text-amber-700">{badge}</span> : null}
      </div>
      <span className="text-lg font-bold tabular-nums text-violet-700">{formatZar(priceZar)}</span>
    </motion.button>
  );
}
