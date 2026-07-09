'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToggleChipProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function ToggleChip({ label, selected, onToggle, disabled }: ToggleChipProps) {
  return (
    <motion.button
      type="button"
      layout
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
        selected
          ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-500/25'
          : 'border-gray-200 bg-white text-gray-800 hover:border-violet-300 hover:bg-violet-50/50',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {label}
    </motion.button>
  );
}
