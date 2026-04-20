'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MobileCardSelectorItem {
  id: string;
  label: string;
  caption?: string;
  disabled?: boolean;
  badge?: string;
  /** Whole percent above base when surge pricing applies. */
  surgePercent?: number;
}

interface MobileCardSelectorProps {
  items: MobileCardSelectorItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function MobileCardSelector({ items, selectedId, onSelect, className }: MobileCardSelectorProps) {
  return (
    <div
      className={cn(
        // Mobile: stable 2-column grid, comfortable gaps; sm+: wrap like chips
        'grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-2',
        className
      )}
    >
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        const isRecommended = Boolean(item.badge) && !item.disabled;
        return (
          <motion.button
            key={item.id}
            type="button"
            whileTap={item.disabled ? undefined : { scale: 0.97 }}
            disabled={item.disabled}
            onClick={() => !item.disabled && onSelect(item.id)}
            aria-pressed={isSelected}
            className={cn(
              'touch-manipulation select-none rounded-xl border-2 px-2.5 py-3 text-center transition-colors sm:px-3 sm:py-2 sm:text-left',
              // Mobile: 52px tap height, centered time; sm+: compact left-aligned chips
              'flex min-h-[52px] flex-col items-center justify-center sm:min-h-[44px] sm:items-start sm:justify-center',
              item.disabled
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                : 'bg-white',
              !item.disabled &&
                isSelected &&
                'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20',
              !item.disabled &&
                !isSelected &&
                isRecommended &&
                'border-primary/45 bg-gradient-to-b from-primary/[0.09] to-white text-gray-900 shadow-sm',
              !item.disabled && !isSelected && !isRecommended && 'border-gray-200 text-gray-800 hover:border-primary/35 active:bg-gray-50'
            )}
          >
            {item.badge ? (
              <span
                className={cn(
                  'mb-1 block text-[9px] font-bold uppercase tracking-wider sm:mb-0.5 sm:text-[10px]',
                  isSelected ? 'text-primary-foreground/90' : 'text-primary'
                )}
              >
                {item.badge}
              </span>
            ) : null}
            <span className="block text-lg font-bold tabular-nums leading-none sm:text-sm">{item.label}</span>
            {item.caption || (item.surgePercent != null && item.surgePercent > 0) ? (
              <div className="max-sm:mt-1 max-sm:flex max-sm:w-full max-sm:flex-row max-sm:flex-wrap max-sm:items-center max-sm:justify-center max-sm:gap-1.5 sm:contents">
                {item.caption ? (
                  <span
                    className={cn(
                      'block truncate text-[11px] leading-tight max-sm:max-w-[min(100%,7rem)] sm:mt-0.5 sm:max-w-[10rem]',
                      isSelected ? 'text-primary-foreground/90' : 'text-gray-500',
                      !isSelected && isRecommended && 'text-gray-600'
                    )}
                  >
                    {item.caption}
                  </span>
                ) : null}
                {item.surgePercent != null && item.surgePercent > 0 ? (
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none sm:mt-1 sm:inline-flex',
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80'
                    )}
                    title="Price includes a demand-based increase for this time"
                  >
                    +{item.surgePercent}% surge
                  </span>
                ) : null}
              </div>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}
