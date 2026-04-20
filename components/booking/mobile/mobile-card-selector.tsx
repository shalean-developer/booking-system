'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MobileCardSelectorItem {
  id: string;
  label: string;
  caption?: string;
  disabled?: boolean;
  badge?: string;
}

interface MobileCardSelectorProps {
  items: MobileCardSelectorItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function MobileCardSelector({ items, selectedId, onSelect, className }: MobileCardSelectorProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:flex sm:flex-wrap', className)}>
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <motion.button
            key={item.id}
            type="button"
            whileTap={item.disabled ? undefined : { scale: 0.96 }}
            disabled={item.disabled}
            onClick={() => !item.disabled && onSelect(item.id)}
            className={cn(
              'min-h-[44px] rounded-xl border-2 px-3 py-2 text-left transition-colors',
              item.disabled ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-gray-200 text-gray-800 hover:border-primary/40'
            )}
          >
            {item.badge ? (
              <span
                className={cn(
                  'mb-0.5 block text-[10px] font-semibold uppercase tracking-wide',
                  isSelected ? 'text-primary-foreground/90' : 'text-emerald-700'
                )}
              >
                {item.badge}
              </span>
            ) : null}
            <span className="block text-sm font-bold leading-tight">{item.label}</span>
            {item.caption ? (
              <span className={cn('mt-0.5 block text-[11px] leading-tight', isSelected ? 'text-primary-foreground/85' : 'text-gray-500')}>
                {item.caption}
              </span>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}
