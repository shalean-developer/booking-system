'use client';

import React from 'react';
import { Wallet, Clock, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatZarFromCents, type CleanerFinancialData } from '@/lib/cleaner-financial';
import { useCleanerFinancial } from './cleaner-financial-context';

function formatPayoutDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

type CardDef = {
  id: string;
  label: string;
  hint: string;
  value: string;
  icon: typeof Wallet;
  highlight: 'emerald' | 'amber' | null;
};

function buildCards(loading: boolean, data: CleanerFinancialData | null): CardDef[] {
  const balance = data?.wallet?.balance ?? 0;
  const pending = data?.wallet?.pending_balance ?? 0;
  const totalEarned = data?.totals.total_earnings_cents ?? 0;
  const next = data?.next_payout_date ?? null;
  const countdown = data?.next_payout_countdown_label ?? null;

  return [
    {
      id: 'avail',
      label: 'Available Balance',
      hint: 'Ready for scheduled payout',
      value: loading ? '…' : formatZarFromCents(balance),
      icon: Wallet,
      highlight: 'emerald',
    },
    {
      id: 'pend',
      label: 'Pending Earnings',
      hint: 'Review or hold — not yet available',
      value: loading ? '…' : formatZarFromCents(pending),
      icon: Clock,
      highlight: 'amber',
    },
    {
      id: 'tot',
      label: 'Total Earnings (ledger)',
      hint: 'All credited job earnings',
      value: loading ? '…' : formatZarFromCents(totalEarned),
      icon: TrendingUp,
      highlight: null,
    },
    {
      id: 'next',
      label: 'Next payout window',
      hint: countdown || '—',
      value: loading ? '…' : formatPayoutDate(next),
      icon: Calendar,
      highlight: null,
    },
  ];
}

export function FinancialSummaryCards({ className }: { className?: string }) {
  const { data, loading } = useCleanerFinancial();
  const cards = buildCards(loading, data);

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
      {cards.map(card => (
        <div
          key={card.id}
          className={cn(
            'bg-white/15 backdrop-blur-sm border rounded-2xl px-3 sm:px-4 py-3 flex items-start gap-2 sm:gap-3 min-w-0',
            card.highlight === 'emerald' && 'border-emerald-300/50 ring-1 ring-emerald-400/20',
            card.highlight === 'amber' && 'border-amber-300/50 ring-1 ring-amber-400/20',
            !card.highlight && 'border-white/20',
          )}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-extrabold text-xs sm:text-sm leading-tight break-words">{card.value}</p>
            <p className="text-blue-200 text-[9px] sm:text-[10px] mt-0.5 font-medium leading-snug">{card.label}</p>
            <p className="text-blue-100/80 text-[9px] mt-0.5 leading-snug">{card.hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Same metrics for the light (non-hero) earnings page background. */
export function FinancialSummaryCardsLight({ className }: { className?: string }) {
  const { data, loading } = useCleanerFinancial();
  const cards = buildCards(loading, data);

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3', className)}>
      {cards.map(card => (
        <div
          key={card.id}
          className={cn(
            'bg-white border rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3 min-w-0',
            card.highlight === 'emerald' && 'border-emerald-200 ring-1 ring-emerald-100',
            card.highlight === 'amber' && 'border-amber-200 ring-1 ring-amber-100',
            !card.highlight && 'border-gray-200',
          )}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <card.icon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-900 font-extrabold text-sm leading-tight break-words">{card.value}</p>
            <p className="text-gray-500 text-[10px] mt-0.5 font-medium leading-snug">{card.label}</p>
            <p className="text-gray-400 text-[9px] mt-0.5 leading-snug">{card.hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
