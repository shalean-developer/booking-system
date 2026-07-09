'use client';

import { Check, ShieldCheck, Sparkles, Star, TimerReset, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RecommendedCleanerCard({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-100/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Recommended for you</p>
          <h3 className="mt-1 text-lg font-bold text-gray-900">Best available cleaner</h3>
          <p className="mt-1 text-sm text-gray-600">We&apos;ll match you based on time &amp; location.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          4.8
        </span>
        <span className="inline-flex items-center gap-1 text-gray-700">
          <Users className="h-4 w-4 text-gray-500" />
          100+ jobs
        </span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        <li className="inline-flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" /> Vetted professional
        </li>
        <li className="inline-flex items-center gap-2">
          <TimerReset className="h-4 w-4 text-emerald-600" /> On-time guarantee
        </li>
        <li className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" /> Backup available
        </li>
      </ul>

      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className={cn(
          'mt-4 inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm',
          disabled
            ? 'cursor-not-allowed bg-gray-300'
            : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
        )}
      >
        Confirm this cleaner
      </button>
    </div>
  );
}

