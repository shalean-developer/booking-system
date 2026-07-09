'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type StickyPriceBarProps = {
  finalPriceZar: number | null;
  locked: boolean;
  breakdownLines: string[];
  ctaLabel?: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

function formatZar(n: number) {
  return `R ${Math.round(n).toLocaleString('en-ZA')}`;
}

export function StickyPriceBar({
  finalPriceZar,
  locked,
  breakdownLines,
  ctaLabel = 'Continue',
  onContinue,
  continueDisabled,
  isLoading,
  className,
}: StickyPriceBarProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-md lg:sticky lg:top-6',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {locked ? 'Final price (locked)' : 'Final price'}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={finalPriceZar ?? 'empty'}
              initial={{ opacity: 0.6, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1 text-3xl font-bold tracking-tight text-gray-900"
            >
              {finalPriceZar != null ? formatZar(finalPriceZar) : '—'}
            </motion.p>
          </AnimatePresence>
          <ul className="mt-2 space-y-0.5 text-xs text-gray-600">
            {breakdownLines.map((line) => (
              <li key={line} className="truncate">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={continueDisabled || isLoading}
          onClick={() => void onContinue()}
          className="w-full shrink-0 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 text-base font-semibold shadow-md hover:from-violet-500 hover:to-fuchsia-500 sm:w-auto"
        >
          {isLoading ? 'Working…' : ctaLabel}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-gray-500">No hidden fees · Price set in this step carries through checkout</p>
    </div>
  );
}
