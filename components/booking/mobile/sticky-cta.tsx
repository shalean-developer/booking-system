'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StickyCTAProps {
  title?: string;
  subtitle?: string;
  totalLabel?: string;
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
  helperText?: string;
  urgencyText?: string;
  className?: string;
}

export function StickyCTA({
  title,
  subtitle,
  totalLabel,
  buttonLabel,
  onClick,
  disabled = false,
  helperText,
  urgencyText,
  className,
}: StickyCTAProps) {
  return (
    <motion.div
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      {(title || totalLabel || subtitle) && (
        <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title ? <p className="truncate text-sm font-semibold text-gray-900">{title}</p> : null}
            {subtitle ? <p className="truncate text-xs text-gray-500 mt-0.5">{subtitle}</p> : null}
          </div>
          {totalLabel ? (
            <motion.p
              key={totalLabel}
              initial={{ y: -4, opacity: 0.7 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-extrabold text-gray-900 tabular-nums"
            >
              {totalLabel}
            </motion.p>
          ) : null}
        </div>
      )}
      <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'w-full min-h-[48px] rounded-xl px-4 text-base font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]',
            disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <span>{buttonLabel}</span>
          {!disabled ? <ArrowRight size={18} aria-hidden /> : null}
        </button>
        {urgencyText ? <p className="mt-2 text-center text-xs font-semibold text-orange-600">{urgencyText}</p> : null}
        {helperText ? <p className="mt-2 text-center text-xs text-gray-500">{helperText}</p> : null}
      </div>
    </motion.div>
  );
}
