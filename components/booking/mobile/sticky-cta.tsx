'use client';

import { useState, type ReactNode } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface StickyCTAProps {
  title?: string;
  subtitle?: string;
  totalLabel?: string;
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
  helperText?: string;
  className?: string;
  /** Mobile-only: opens from bottom when user taps price + chevron */
  priceSummary?: ReactNode;
  /** Accessible label for the price expand control */
  priceSummaryTitle?: string;
}

export function StickyCTA({
  title,
  subtitle,
  totalLabel,
  buttonLabel,
  onClick,
  disabled = false,
  helperText,
  className,
  priceSummary,
  priceSummaryTitle = 'Price summary',
}: StickyCTAProps) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const showPriceExpand = Boolean(totalLabel && priceSummary);

  return (
    <>
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
          className
        )}
      >
        {(title || subtitle) && (
          <div className="px-4 pt-3 pb-1">
            {title ? (
              <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{title}</p>
            ) : null}
            {subtitle ? (
              <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{subtitle}</p>
            ) : null}
          </div>
        )}

        <div className="px-4 py-3 flex flex-row items-center gap-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {totalLabel ? (
            <div className="shrink-0 flex items-center justify-center">
              {showPriceExpand ? (
                <button
                  type="button"
                  onClick={() => setSummaryOpen(true)}
                  className="flex flex-row items-center gap-0.5 rounded-xl px-2 py-2 min-h-[48px] text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-200/90 bg-gray-50/80"
                  aria-label={`${priceSummaryTitle} — ${totalLabel}`}
                >
                  <motion.span
                    key={totalLabel}
                    initial={{ y: -4, opacity: 0.7 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-base sm:text-lg font-extrabold text-gray-900 tabular-nums whitespace-nowrap"
                  >
                    {totalLabel}
                  </motion.span>
                  <ChevronRight
                    className="h-5 w-5 text-gray-500 flex-shrink-0"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </button>
              ) : (
                <motion.p
                  key={totalLabel}
                  initial={{ y: -4, opacity: 0.7 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-base sm:text-lg font-extrabold text-gray-900 tabular-nums whitespace-nowrap px-2 py-2 min-h-[48px] flex items-center border border-transparent"
                >
                  {totalLabel}
                </motion.p>
              )}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'min-h-[48px] rounded-xl px-3 text-sm sm:text-base font-bold flex flex-1 min-w-0 items-center justify-center gap-2 transition-colors active:scale-[0.99]',
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <span className="truncate">{buttonLabel}</span>
            {!disabled ? <ArrowRight size={18} className="flex-shrink-0" aria-hidden /> : null}
          </button>
        </div>

        {helperText ? (
          <p className="px-4 pb-3 text-center text-xs text-gray-500 -mt-1">{helperText}</p>
        ) : null}
      </motion.div>

      {showPriceExpand ? (
        <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl max-h-[min(88vh,640px)] overflow-y-auto z-[60] px-4 pb-8 pt-2"
          >
            <SheetHeader className="text-left space-y-1 pb-2 border-b border-border/60">
              <SheetTitle>{priceSummaryTitle}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 pb-2">{priceSummary}</div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
