import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getPayoutHoldHours } from '@/lib/wallet';

/** Service client typed against `Database` — use with `createServiceClientForSchema()`. */
export type FinancialSupabaseClient = SupabaseClient<Database>;

export type PayoutSchedule = 'weekly' | 'monthly';

export type EarningUiKind = 'pending' | 'held' | 'available' | 'paid';

export type CleanerFinancialData = {
  cleaner_id: string;
  wallet: {
    balance: number;
    pending_balance: number;
    updated_at: string;
  } | null;
  payout_schedule: PayoutSchedule;
  payout_day: number;
  recipient: {
    bank_name: string | null;
    account_number: string | null;
    recipient_code: string;
  } | null;
  totals: {
    total_earnings_cents: number;
    month_earnings_cents: number;
  };
  next_payout_date: string | null;
  /** Whole days from today until `next_payout_date` (0 = today). */
  next_payout_in_days: number | null;
  /** User-facing countdown, e.g. "Next payout in 3 days". */
  next_payout_countdown_label: string | null;
  hold_hours: number;
  earnings: Array<{
    id: string;
    booking_id: string | null;
    amount_cents: number;
    created_at: string;
    kind: EarningUiKind;
    label: string;
    description: string;
  }>;
  payouts: Array<{
    id: string;
    amount_cents: number;
    created_at: string;
    status: string;
    paystack_reference: string | null;
  }>;
};

export function formatZarFromCents(cents: number): string {
  const amount = Math.round(cents) / 100;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parsePayoutSchedule(raw: string | null | undefined): PayoutSchedule {
  return raw === 'monthly' ? 'monthly' : 'weekly';
}

export function earningUiLabel(kind: EarningUiKind, holdHours: number): string {
  switch (kind) {
    case 'pending':
      return 'Awaiting review';
    case 'held':
      return `On hold (${holdHours}h)`;
    case 'available':
      return 'Ready for payout';
    case 'paid':
      return 'Paid out';
    default:
      return '—';
  }
}

export function earningUiDescription(kind: EarningUiKind, holdHours: number): string {
  switch (kind) {
    case 'pending':
      return 'Admin is still reviewing this job’s earnings.';
    case 'held':
      return `Funds clear after ${holdHours} hours, then move to your available balance.`;
    case 'available':
      return 'Included in your next automatic bank transfer (schedule + minimum apply).';
    case 'paid':
      return 'This amount was already sent in a previous bank payout.';
    default:
      return '';
  }
}

/** Whole calendar days from `from` (local midnight) to payout date. */
export function computeDaysUntilPayoutDate(isoDate: string | null, from: Date = new Date()): number | null {
  if (!isoDate) return null;
  const t = new Date(`${isoDate}T12:00:00`);
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function formatPayoutCountdown(days: number | null): string | null {
  if (days === null) return null;
  if (days < 0) return 'Schedule check: past window — see next run';
  if (days === 0) return 'Next payout: today';
  if (days === 1) return 'Next payout in 1 day';
  return `Next payout in ${days} days`;
}

/** Matches cron `scheduleMatchesToday` (weekly: 0=Sun..6=Sat; monthly: 1..31 clamped). */
export function scheduleMatchesToday(
  schedule: PayoutSchedule,
  payoutDay: number,
  now: Date,
): boolean {
  if (schedule === 'weekly') {
    const d = Math.max(0, Math.min(6, Math.floor(Number(payoutDay)) || 0));
    return now.getDay() === d;
  }
  const want = Math.max(1, Math.min(31, Math.floor(Number(payoutDay)) || 1));
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const target = Math.min(want, lastDay);
  return now.getDate() === target;
}

/**
 * Next calendar date (ISO yyyy-mm-dd) when the cleaner's payout schedule runs.
 */
export function computeNextPayoutDateIso(
  schedule: PayoutSchedule,
  payoutDay: number,
  from: Date = new Date(),
): string | null {
  const start = new Date(from);
  start.setHours(12, 0, 0, 0);

  if (schedule === 'weekly') {
    const targetDow = Math.max(0, Math.min(6, Math.floor(Number(payoutDay)) || 0));
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d.getDay() === targetDow) {
        return d.toISOString().split('T')[0] ?? null;
      }
    }
    return null;
  }

  const want = Math.max(1, Math.min(31, Math.floor(Number(payoutDay)) || 1));
  for (let monthOffset = 0; monthOffset < 36; monthOffset++) {
    const y = start.getFullYear();
    const m = start.getMonth() + monthOffset;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const target = Math.min(want, lastDay);
    const candidate = new Date(y, m, target);
    candidate.setHours(12, 0, 0, 0);
    if (candidate >= start) {
      return candidate.toISOString().split('T')[0] ?? null;
    }
  }
  return null;
}

export async function getCleanerFinancialData(
  supabase: FinancialSupabaseClient,
  cleanerId: string,
): Promise<CleanerFinancialData> {
  const holdHours = getPayoutHoldHours();
  const now = new Date();

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const [walletRes, cleanerRes, txRes, recipientRes] = await Promise.all([
    supabase.from('cleaner_wallets').select('*').eq('cleaner_id', cleanerId).maybeSingle(),
    supabase.from('cleaners').select('payout_schedule, payout_day').eq('id', cleanerId).maybeSingle(),
    supabase
      .from('wallet_transactions')
      .select('*')
      .eq('cleaner_id', cleanerId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('payout_recipients').select('*').eq('cleaner_id', cleanerId).maybeSingle(),
  ]);

  if (walletRes.error) {
    console.error('[cleaner-financial] cleaner_wallets', walletRes.error.message);
  }
  if (cleanerRes.error) {
    console.error('[cleaner-financial] cleaners schedule', cleanerRes.error.message);
  }
  if (txRes.error) {
    console.error('[cleaner-financial] wallet_transactions', txRes.error.message);
  }
  if (recipientRes.error) {
    console.error('[cleaner-financial] payout_recipients', recipientRes.error.message);
  }

  const wallet = walletRes.data;
  const schedule = parsePayoutSchedule(cleanerRes.data?.payout_schedule);
  const payoutDay = cleanerRes.data?.payout_day ?? 5;
  const txs = txRes.data ?? [];
  const recipient = recipientRes.data;

  const earningTxs = txs.filter(t => t.type === 'earning');
  const totalEarningsCents = earningTxs.reduce((s, t) => s + Number(t.amount), 0);
  const monthEarningsCents = earningTxs
    .filter(t => new Date(t.created_at) >= monthStart)
    .reduce((s, t) => s + Number(t.amount), 0);

  const payoutFifoPool = txs
    .filter(t => t.type === 'payout' && (t.status === 'completed' || t.status === 'processing'))
    .reduce((s, t) => s + Number(t.amount), 0);

  const eligibleOrdered = earningTxs
    .filter(t => t.status === 'completed')
    .filter(t => !t.available_for_payout_at || new Date(t.available_for_payout_at) <= now)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let pool = payoutFifoPool;
  const paidIds = new Set<string>();
  for (const e of eligibleOrdered) {
    if (pool >= e.amount) {
      paidIds.add(e.id);
      pool -= e.amount;
    }
  }

  const earnings = [...earningTxs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(t => {
      let kind: EarningUiKind;
      if (t.status === 'pending') {
        kind = 'pending';
      } else if (
        t.status === 'completed' &&
        t.available_for_payout_at &&
        new Date(t.available_for_payout_at) > now
      ) {
        kind = 'held';
      } else if (t.status === 'completed' && paidIds.has(t.id)) {
        kind = 'paid';
      } else if (t.status === 'completed') {
        kind = 'available';
      } else {
        kind = 'available';
      }
      return {
        id: t.id,
        booking_id: t.booking_id,
        amount_cents: Number(t.amount),
        created_at: t.created_at,
        kind,
        label: earningUiLabel(kind, holdHours),
        description: earningUiDescription(kind, holdHours),
      };
    });

  const payouts = txs
    .filter(t => t.type === 'payout')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(t => ({
      id: t.id,
      amount_cents: Number(t.amount),
      created_at: t.created_at,
      status: t.status,
      paystack_reference: t.paystack_reference,
    }));

  const nextPayoutDate = computeNextPayoutDateIso(schedule, payoutDay, now);
  const nextDays = computeDaysUntilPayoutDate(nextPayoutDate, now);
  const countdownLabel = formatPayoutCountdown(nextDays);

  return {
    cleaner_id: cleanerId,
    wallet: wallet
      ? {
          balance: Number(wallet.balance),
          pending_balance: Number(wallet.pending_balance),
          updated_at: wallet.updated_at,
        }
      : null,
    payout_schedule: schedule,
    payout_day: Number(payoutDay),
    recipient: recipient
      ? {
          bank_name: recipient.bank_name,
          account_number: recipient.account_number,
          recipient_code: recipient.recipient_code,
        }
      : null,
    totals: {
      total_earnings_cents: totalEarningsCents,
      month_earnings_cents: monthEarningsCents,
    },
    next_payout_date: nextPayoutDate,
    next_payout_in_days: nextDays,
    next_payout_countdown_label: countdownLabel,
    hold_hours: holdHours,
    earnings,
    payouts,
  };
}
