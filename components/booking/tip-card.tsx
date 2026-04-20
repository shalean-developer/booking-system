'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BOOKING_TIP_PRESETS, isPresetTipAmount } from '@/components/booking/tip-selector';

function initialsFromDisplayName(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export interface TipCardProps {
  cleanerName: string;
  cleanerPhotoUrl?: string | null;
  /** True when the booking uses a team label (no individual photo). */
  isTeam?: boolean;
  headerTone?: 'dark' | 'blue';
  tipAmount: number;
  onTipChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Premium tip block: dark header + overlapping avatar + preset chips + optional custom amount.
 */
export function TipCard({
  cleanerName,
  cleanerPhotoUrl = null,
  isTeam = false,
  headerTone = 'dark',
  tipAmount,
  onTipChange,
  className,
  disabled = false,
}: TipCardProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const customHighlighted =
    customOpen || (tipAmount > 0 && !isPresetTipAmount(tipAmount));

  useEffect(() => {
    if (customOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [customOpen]);

  const applyCustom = useCallback(() => {
    const raw = customDraft.replace(/[^\d]/g, '');
    const n = raw === '' ? 0 : Math.max(0, Math.min(50000, parseInt(raw, 10)));
    onTipChange(Number.isFinite(n) ? n : 0);
    setCustomDraft('');
    setCustomOpen(false);
  }, [customDraft, onTipChange]);

  const openCustom = () => {
    if (disabled) return;
    setCustomOpen(true);
    setCustomDraft(tipAmount > 0 && !isPresetTipAmount(tipAmount) ? String(tipAmount) : '');
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-md overflow-hidden border border-gray-100/80',
        className,
      )}
    >
      <div className="relative">
        {/* Dark header — extra bottom padding for avatar overlap */}
        <div
          className={cn(
            'text-white px-4 pt-3 pb-8 pl-14 min-h-[4.5rem]',
            headerTone === 'blue' ? 'bg-gradient-to-r from-primary to-blue-500' : 'bg-zinc-950'
          )}
        >
          <p className="text-[11px] font-medium text-white/75 tracking-wide">An upfront tip for</p>
          <p className="text-base font-bold text-white leading-snug truncate pr-1">{cleanerName}</p>
        </div>

        {/* Avatar — overlaps header + body */}
        <div
          className="absolute left-4 top-3 z-10 h-10 w-10 rounded-full border-2 border-white bg-zinc-800 shadow-md overflow-hidden flex items-center justify-center"
          aria-hidden
        >
          {cleanerPhotoUrl && !isTeam ? (
            <img src={cleanerPhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : isTeam ? (
            <Users className="h-5 w-5 text-white/90" />
          ) : (
            <span className="text-xs font-extrabold text-white">{initialsFromDisplayName(cleanerName)}</span>
          )}
        </div>

        {/* Body */}
        <div className="bg-white px-4 pt-3 pb-4">
          <p className="text-xs font-medium text-gray-500 mb-2.5">Tip amount</p>

          <div className="flex flex-wrap items-center gap-2">
            {BOOKING_TIP_PRESETS.map((preset) => {
              const selected = tipAmount === preset.value && isPresetTipAmount(tipAmount);
              return (
                <motion.button
                  key={preset.id}
                  type="button"
                  disabled={disabled}
                  whileTap={disabled ? undefined : { scale: 0.94 }}
                  onClick={() => {
                    setCustomOpen(false);
                    setCustomDraft('');
                    onTipChange(preset.value);
                  }}
                  className={cn(
                    'min-h-[2.25rem] min-w-[3rem] px-2.5 rounded-full text-xs font-semibold border-2 transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2',
                    disabled && 'opacity-50 cursor-not-allowed',
                    selected
                      ? 'border-green-600 text-green-700 bg-green-50/50'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300',
                  )}
                  aria-pressed={selected}
                >
                  {preset.label}
                </motion.button>
              );
            })}

            <button
              type="button"
              disabled={disabled}
              onClick={openCustom}
              className={cn(
                'ml-2 text-left text-xs font-semibold text-green-700 hover:text-green-800 underline-offset-2 hover:underline transition-colors leading-tight',
                disabled && 'opacity-50 pointer-events-none',
                customHighlighted && 'underline',
              )}
            >
              Custom
              <br />
              amount
            </button>
          </div>

          <AnimatePresence>
            {customOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="sr-only" htmlFor="tip-custom-amount">
                    Custom tip in rands
                  </label>
                  <div className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-0">
                    <span className="text-sm font-semibold text-gray-500">R</span>
                    <input
                      ref={inputRef}
                      id="tip-custom-amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 75"
                      value={customDraft}
                      onChange={(e) => setCustomDraft(e.target.value.replace(/[^\d]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applyCustom();
                        if (e.key === 'Escape') {
                          setCustomOpen(false);
                          setCustomDraft('');
                        }
                      }}
                      disabled={disabled}
                      className="w-full min-w-0 rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 placeholder:text-gray-300 focus:border-green-600 focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={applyCustom}
                      className="w-full sm:w-auto rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomOpen(false);
                        setCustomDraft('');
                      }}
                      className="w-full sm:w-auto rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">100% goes to your cleaner</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!customOpen && (
            <p className="text-[10px] text-gray-400 mt-2">100% goes to your cleaner</p>
          )}
        </div>
      </div>
    </div>
  );
}
