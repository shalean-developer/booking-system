/**
 * Cleaner wallet — credits on completed jobs, debits on Paystack payouts.
 * Uses Supabase service role RPCs for atomic balance + ledger updates.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getResolvedBookingPayoutTotalCents,
  splitCentsEvenly,
} from '@/lib/earnings-v2';

/** Hours after job completion before earnings count toward Paystack eligibility (bonus). */
export function getPayoutHoldHours(): number {
  const raw = process.env.PAYOUT_HOLD_HOURS;
  if (raw === undefined || raw === '') return 24;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 24;
}

/** Minimum balance (cents) before cron sends a Paystack transfer. Default R500. */
export function getMinPayoutCents(): number {
  const raw = process.env.PAYSTACK_MIN_PAYOUT_CENTS ?? process.env.MIN_PAYOUT_CENTS;
  if (raw === undefined || raw === '') return 50_000;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 50_000;
}

function completionTimestampIso(booking: {
  completed_at?: string | null;
  cleaner_completed_at?: string | null;
}): string {
  const s = booking.completed_at || booking.cleaner_completed_at;
  if (s) return s;
  return new Date().toISOString();
}

function availableForPayoutAtIso(booking: {
  completed_at?: string | null;
  cleaner_completed_at?: string | null;
}): string | null {
  const holdMs = getPayoutHoldHours() * 60 * 60 * 1000;
  if (holdMs <= 0) {
    return new Date().toISOString();
  }
  const base = new Date(completionTimestampIso(booking)).getTime();
  return new Date(base + holdMs).toISOString();
}

export type BookingLike = {
  id: string;
  status?: string;
  payment_status?: string | null;
  requires_team?: boolean | null;
  cleaner_id?: string | null;
  assigned_cleaner_id?: string | null;
  earnings_status?: string | null;
  earnings_final?: number | null;
  earnings_calculated?: number | null;
  cleaner_earnings?: number | null;
  completed_at?: string | null;
  cleaner_completed_at?: string | null;
};

/**
 * Build per-cleaner credit lines for a completed booking (solo or team).
 */
export async function loadPayoutLinesForBooking(
  svc: SupabaseClient,
  booking: BookingLike
): Promise<Array<{ cleanerId: string; amountCents: number }>> {
  if (booking.requires_team) {
    const { data: team } = await svc
      .from('booking_teams')
      .select('id')
      .eq('booking_id', booking.id)
      .maybeSingle();

    if (!team?.id) {
      return [];
    }

    const { data: members, error } = await svc
      .from('booking_team_members')
      .select('cleaner_id, earnings')
      .eq('booking_team_id', team.id);

    if (error || !members?.length) {
      return [];
    }

    const lines: Array<{ cleanerId: string; amountCents: number }> = [];
    for (const m of members) {
      const cents = Math.round(Number(m.earnings) || 0);
      if (cents > 0) {
        lines.push({ cleanerId: m.cleaner_id, amountCents: cents });
      }
    }

    if (lines.length > 0) {
      return lines;
    }

    const total = getResolvedBookingPayoutTotalCents(booking);
    if (total == null || total <= 0) {
      return [];
    }
    const split = splitCentsEvenly(total, members.length);
    return members.map((m, i) => ({
      cleanerId: m.cleaner_id,
      amountCents: split[i] ?? 0,
    })).filter((x) => x.amountCents > 0);
  }

  const cleanerId = booking.cleaner_id || booking.assigned_cleaner_id;
  if (!cleanerId) {
    return [];
  }

  const total = getResolvedBookingPayoutTotalCents(booking);
  if (total == null || total <= 0) {
    return [];
  }

  return [{ cleanerId, amountCents: total }];
}

/**
 * Whether earnings go to pending_balance until admin approval.
 */
export function earningsRequireWalletHold(booking: BookingLike): boolean {
  return booking.earnings_status === 'pending';
}

/**
 * Credit wallets when a booking moves to completed (idempotent per cleaner + booking).
 */
export async function creditWalletForCompletedBooking(
  svc: SupabaseClient,
  booking: BookingLike
): Promise<{ ok: true; credited: number } | { ok: false; error: string }> {
  if (booking.status !== 'completed') {
    return { ok: false, error: 'Booking is not completed' };
  }

  const ps = String(booking.payment_status || '').toLowerCase();
  if (ps === 'refunded') {
    console.warn('[wallet] credit_wallet_skipped_refunded', { booking_id: booking.id });
    return { ok: false, error: 'Booking is refunded' };
  }

  const lines = await loadPayoutLinesForBooking(svc, booking);
  if (lines.length === 0) {
    return { ok: false, error: 'No payout lines (missing cleaner or zero earnings)' };
  }

  const creditPending = earningsRequireWalletHold(booking);
  const availableAt = creditPending ? null : availableForPayoutAtIso(booking);

  let credited = 0;

  for (const line of lines) {
    const { data: existing } = await svc
      .from('wallet_transactions')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('cleaner_id', line.cleanerId)
      .eq('type', 'earning')
      .maybeSingle();

    if (existing) {
      continue;
    }

    const { data: txId, error } = await svc.rpc('apply_wallet_earning', {
      cleaner_id_input: line.cleanerId,
      booking_id_input: booking.id,
      amount_input: line.amountCents,
      credit_pending: creditPending,
      available_for_payout_at_input: availableAt,
    });

    if (error) {
      console.error('[wallet] apply_wallet_earning failed', error);
      return { ok: false, error: error.message };
    }

    if (txId) {
      credited += 1;
    }
  }

  if (credited === 0) {
    const { data: anyEarning } = await svc
      .from('wallet_transactions')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('type', 'earning')
      .limit(1)
      .maybeSingle();

    if (anyEarning) {
      await svc.from('bookings').update({ payout_status: 'paid' }).eq('id', booking.id);
      return { ok: true, credited: 0 };
    }
    return { ok: false, error: 'Wallet credit failed (no transaction created)' };
  }

  const { error: updErr } = await svc.from('bookings').update({ payout_status: 'paid' }).eq('id', booking.id);

  if (updErr) {
    console.error('[wallet] set payout_status failed', updErr);
    return { ok: false, error: updErr.message };
  }

  return { ok: true, credited };
}

/**
 * After admin approves earnings, move pending_balance → balance and mark earning txs completed.
 */
export async function releasePendingWalletAfterEarningsApproval(
  svc: SupabaseClient,
  bookingId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: pendingRows, error: pendErr } = await svc
    .from('wallet_transactions')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('type', 'earning')
    .eq('status', 'pending');

  if (pendErr) {
    return { ok: false, error: pendErr.message };
  }

  if (!pendingRows?.length) {
    return { ok: true };
  }

  const { data: booking, error: bErr } = await svc
    .from('bookings')
    .select('completed_at, cleaner_completed_at')
    .eq('id', bookingId)
    .maybeSingle();

  if (bErr || !booking) {
    return { ok: false, error: 'Booking not found' };
  }

  const { error: rpcErr } = await svc.rpc('release_pending_wallet_earnings_for_booking', {
    p_booking_id: bookingId,
  });

  if (rpcErr) {
    console.error('[wallet] release_pending_wallet_earnings_for_booking', rpcErr);
    return { ok: false, error: rpcErr.message };
  }

  const holdMs = getPayoutHoldHours() * 60 * 60 * 1000;
  const base = new Date(
    booking.completed_at || booking.cleaner_completed_at || new Date().toISOString()
  ).getTime();
  const availableAt =
    holdMs <= 0 ? new Date().toISOString() : new Date(base + holdMs).toISOString();

  const ids = pendingRows.map((r) => r.id);
  const { error: updErr } = await svc
    .from('wallet_transactions')
    .update({
      available_for_payout_at: availableAt,
    })
    .in('id', ids);

  if (updErr) {
    console.error('[wallet] set available_for_payout_at', updErr);
    return { ok: false, error: updErr.message };
  }

  return { ok: true };
}

/** Thin wrapper around the `increment_wallet_balance` RPC (balance-only bump). */
export async function incrementWalletBalance(
  svc: SupabaseClient,
  cleanerId: string,
  amountCents: number
): Promise<{ error: Error | null }> {
  const { error } = await svc.rpc('increment_wallet_balance', {
    cleaner_id_input: cleanerId,
    amount_input: amountCents,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function fetchEligiblePayoutCents(
  svc: SupabaseClient,
  cleanerId: string
): Promise<number> {
  const { data, error } = await svc.rpc('get_eligible_payout_cents', {
    p_cleaner_id: cleanerId,
  });

  if (error) {
    console.error('[wallet] get_eligible_payout_cents', error);
    return 0;
  }

  const n = typeof data === 'number' ? data : Number(data);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Company liability: sum(balance + pending_balance) across all cleaner wallets. */
export async function fetchTotalLiabilityCents(svc: SupabaseClient): Promise<{
  totalCents: number;
  walletRowCount: number;
}> {
  const { data, error } = await svc
    .from('v_cleaner_liability_outstanding')
    .select('total_cents, wallet_row_count')
    .maybeSingle();

  if (error || !data) {
    console.error('[wallet] v_cleaner_liability_outstanding', error);
    return { totalCents: 0, walletRowCount: 0 };
  }

  const row = data as { total_cents: number | string | null; wallet_row_count: number | string | null };
  return {
    totalCents: Math.round(Number(row.total_cents) || 0),
    walletRowCount: Math.round(Number(row.wallet_row_count) || 0),
  };
}
