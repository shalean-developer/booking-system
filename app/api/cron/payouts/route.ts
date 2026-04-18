import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-secret';
import { createServiceClient } from '@/lib/supabase-server';
import { sendPaystackTransfer } from '@/lib/paystack';
import { fetchEligiblePayoutCents, getMinPayoutCents } from '@/lib/wallet';
import { logPayoutEvent } from '@/lib/payout-log';
import {
  buildPayoutRunBatchId,
  buildRetryPayoutIdempotencyKey,
  buildScheduledPayoutIdempotencyKey,
} from '@/lib/payout-idempotency';
import {
  getPayoutMaxRetries,
  getPayoutRetryBaseDelaySeconds,
  getStaleProcessingMaxHours,
} from '@/lib/payout-config';

export const dynamic = 'force-dynamic';

type InitiateRow = { wallet_tx_id: string; is_duplicate: boolean };

function parseInitiateResult(data: unknown): InitiateRow | null {
  if (data == null) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  const wid = o.wallet_tx_id;
  if (typeof wid !== 'string') return null;
  return { wallet_tx_id: wid, is_duplicate: o.is_duplicate === true };
}

/**
 * Re-fetch eligible immediately before initiate_payout_processing (closes TOCTOU vs refunds).
 * Final payAmount uses only freshEligible + balance (+ optional retry cap).
 */
async function finalizePayAmountBeforeInitiate(
  supabase: ReturnType<typeof createServiceClient>,
  args: {
    cleanerId: string;
    balance: number;
    /** Amount computed earlier in the cron loop (for adjustment logging only). */
    draftPayAmount: number;
    phase: 'scheduled' | 'retry';
    /** For retries: cap by failed payout row amount (Paystack retry semantics). */
    retryCapCents?: number | null;
  }
): Promise<{ payAmount: number; freshEligible: number }> {
  const { cleanerId, balance, draftPayAmount, phase, retryCapCents } = args;

  const freshEligible = await fetchEligiblePayoutCents(supabase, cleanerId);
  const cap =
    retryCapCents != null && retryCapCents > 0
      ? Math.min(freshEligible, balance, retryCapCents)
      : Math.min(freshEligible, balance);
  const payAmount = Math.floor(Math.max(0, cap));

  if (payAmount !== draftPayAmount) {
    await logPayoutEvent({
      eventType: 'payout_amount_adjusted_due_to_refund',
      cleanerId,
      level: 'info',
      payload: {
        phase,
        draft_cents: draftPayAmount,
        fresh_eligible_cents: freshEligible,
        balance,
        retry_cap_cents: retryCapCents ?? null,
        final_cents: payAmount,
      },
    });
  }

  return { payAmount, freshEligible };
}

/** Block payout when wallet still has earning rows tied to refunded bookings (forces reconciliation). */
async function mustBlockPayoutForRefundedBookingEarnings(
  supabase: ReturnType<typeof createServiceClient>,
  cleanerId: string,
  phase: 'scheduled' | 'retry'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('cleaner_has_refunded_booking_with_earning', {
    p_cleaner_id: cleanerId,
  });
  if (error) {
    await logPayoutEvent({
      eventType: 'payout_blocked_refunded_booking',
      cleanerId,
      level: 'error',
      payload: { phase, reason: 'eligibility_check_rpc_failed' },
    });
    return true;
  }
  if (data === true) {
    await logPayoutEvent({
      eventType: 'payout_blocked_refunded_booking',
      cleanerId,
      level: 'warn',
      payload: { phase, reason: 'refunded_booking_with_active_earning_rows' },
    });
    return true;
  }
  return false;
}

/**
 * GET /api/cron/payouts?secret=CRON_SECRET
 * 1) Recover stale `processing` payouts (webhook never arrived)
 * 2) Scheduled payouts (day matches cleaner schedule)
 * 3) Retries for failed payouts (next_retry_at due, retry_count < max)
 */
export async function GET(req: NextRequest) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const supabase = createServiceClient();
  const now = new Date();
  const payoutRunBatchId = buildPayoutRunBatchId(now);
  const minPayout = getMinPayoutCents();
  const maxR = getPayoutMaxRetries();
  const delaySec = getPayoutRetryBaseDelaySeconds();

  const staleHours = getStaleProcessingMaxHours();
  const { data: staleCount, error: staleErr } = await supabase.rpc('recover_stale_processing_payouts', {
    p_max_age_hours: staleHours,
  });
  if (staleErr) {
    console.error('[payout-cron] recover_stale_processing_payouts', staleErr);
  } else if (staleCount && staleCount > 0) {
    await logPayoutEvent({
      eventType: 'stale_processing_recovered',
      payload: { count: staleCount, max_age_hours: staleHours },
    });
  }

  const { data: cleaners, error: fetchError } = await supabase
    .from('cleaners')
    .select('id, payout_schedule, payout_day, is_active')
    .eq('is_active', true);

  if (fetchError) {
    console.error('[payout-cron] fetch cleaners', fetchError);
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  const { data: wallets } = await supabase.from('cleaner_wallets').select('cleaner_id, balance, pending_balance');
  const { data: recipients } = await supabase.from('payout_recipients').select('cleaner_id, recipient_code');

  const walletByCleaner = new Map((wallets || []).map((w) => [w.cleaner_id, w] as const));
  const recipientByCleaner = new Map((recipients || []).map((r) => [r.cleaner_id, r.recipient_code] as const));

  const results: Array<{
    cleanerId: string;
    phase: 'scheduled' | 'retry';
    skipped?: string;
    amountCents?: number;
    reference?: string;
    error?: string;
  }> = [];

  for (const c of cleaners || []) {
    const row = c as { id: string; payout_schedule: 'weekly' | 'monthly'; payout_day: number };
    const recipient = recipientByCleaner.get(row.id);

    if (!recipient?.trim()) {
      await logPayoutEvent({
        eventType: 'payout_skipped_no_recipient',
        cleanerId: row.id,
        level: 'warn',
      });
      results.push({ cleanerId: row.id, phase: 'scheduled', skipped: 'no_paystack_recipient' });
      continue;
    }

    const walletRow = walletByCleaner.get(row.id);
    const balance = walletRow?.balance ?? 0;

    if (balance <= 0) {
      results.push({ cleanerId: row.id, phase: 'scheduled', skipped: 'zero_balance' });
      continue;
    }

    if (!scheduleMatchesToday(row.payout_schedule, row.payout_day, now)) {
      results.push({ cleanerId: row.id, phase: 'scheduled', skipped: 'schedule_mismatch' });
      continue;
    }

    const eligibleDraft = await fetchEligiblePayoutCents(supabase, row.id);
    const draftPayAmount = Math.min(eligibleDraft, balance);

    if (balance > eligibleDraft + 1) {
      await logPayoutEvent({
        eventType: 'wallet_balance_exceeds_eligible',
        cleanerId: row.id,
        level: 'warn',
        payload: {
          balance,
          eligible: eligibleDraft,
          note: 'eligible_excludes_refunded_bookings_balance_may_need_reconciliation',
        },
      });
    }

    if (draftPayAmount <= 0) {
      results.push({ cleanerId: row.id, phase: 'scheduled', skipped: 'nothing_eligible_yet' });
      continue;
    }

    if (draftPayAmount < minPayout) {
      results.push({
        cleanerId: row.id,
        phase: 'scheduled',
        skipped: `below_minimum_${minPayout}_cents`,
      });
      continue;
    }

    const { payAmount, freshEligible } = await finalizePayAmountBeforeInitiate(supabase, {
      cleanerId: row.id,
      balance,
      draftPayAmount,
      phase: 'scheduled',
    });

    if (balance > freshEligible + 1) {
      await logPayoutEvent({
        eventType: 'wallet_balance_exceeds_eligible',
        cleanerId: row.id,
        level: 'warn',
        payload: {
          balance,
          eligible: freshEligible,
          phase: 'scheduled',
          note: 'post_refresh_eligible_excludes_refunded_bookings',
        },
      });
    }

    if (payAmount <= 0) {
      results.push({ cleanerId: row.id, phase: 'scheduled', skipped: 'nothing_eligible_yet_after_refresh' });
      continue;
    }

    if (payAmount < minPayout) {
      results.push({
        cleanerId: row.id,
        phase: 'scheduled',
        skipped: `below_minimum_${minPayout}_cents_after_refresh`,
      });
      continue;
    }

    if (await mustBlockPayoutForRefundedBookingEarnings(supabase, row.id, 'scheduled')) {
      results.push({ cleanerId: row.id, phase: 'scheduled', skipped: 'refunded_booking_earning_conflict' });
      continue;
    }

    const idem = buildScheduledPayoutIdempotencyKey(row.id, now);
    const r = await runPayoutAttempt(supabase, {
      cleanerId: row.id,
      recipientCode: recipient,
      payAmount,
      idempotencyKey: idem,
      payoutBatchId: payoutRunBatchId,
      minPayout,
      maxRetries: maxR,
      retryDelaySeconds: delaySec,
      phase: 'scheduled',
    });
    results.push({ cleanerId: row.id, phase: 'scheduled', ...r });
  }

  const { data: failedRetries } = await supabase
    .from('wallet_transactions')
    .select('id, cleaner_id, amount, retry_count, next_retry_at, created_at')
    .eq('type', 'payout')
    .eq('status', 'failed')
    .not('next_retry_at', 'is', null)
    .lte('next_retry_at', now.toISOString())
    .lt('retry_count', maxR)
    .order('next_retry_at', { ascending: true });

  const seen = new Set<string>();
  for (const fr of failedRetries || []) {
    const cid = fr.cleaner_id as string;
    if (seen.has(cid)) continue;
    seen.add(cid);

    const recipient = recipientByCleaner.get(cid);
    if (!recipient?.trim()) {
      await logPayoutEvent({
        eventType: 'retry_skipped_no_recipient',
        cleanerId: cid,
        walletTransactionId: fr.id,
        level: 'warn',
      });
      results.push({ cleanerId: cid, phase: 'retry', skipped: 'no_paystack_recipient' });
      continue;
    }

    const eligibleDraft = await fetchEligiblePayoutCents(supabase, cid);
    const walletRow = walletByCleaner.get(cid);
    const balance = walletRow?.balance ?? 0;
    const retryCapCents = Math.max(0, Number(fr.amount) || 0);
    const draftPayAmount = Math.min(eligibleDraft, balance, retryCapCents);

    if (balance > eligibleDraft + 1) {
      await logPayoutEvent({
        eventType: 'wallet_balance_exceeds_eligible',
        cleanerId: cid,
        level: 'warn',
        payload: {
          balance,
          eligible: eligibleDraft,
          phase: 'retry',
          note: 'eligible_excludes_refunded_bookings_balance_may_need_reconciliation',
        },
      });
    }

    if (draftPayAmount <= 0 || draftPayAmount < minPayout) {
      results.push({ cleanerId: cid, phase: 'retry', skipped: 'ineligible_or_below_min' });
      continue;
    }

    const { payAmount, freshEligible } = await finalizePayAmountBeforeInitiate(supabase, {
      cleanerId: cid,
      balance,
      draftPayAmount,
      phase: 'retry',
      retryCapCents: retryCapCents > 0 ? retryCapCents : null,
    });

    if (balance > freshEligible + 1) {
      await logPayoutEvent({
        eventType: 'wallet_balance_exceeds_eligible',
        cleanerId: cid,
        level: 'warn',
        payload: {
          balance,
          eligible: freshEligible,
          phase: 'retry',
          note: 'post_refresh_eligible_excludes_refunded_bookings',
        },
      });
    }

    if (payAmount <= 0) {
      results.push({ cleanerId: cid, phase: 'retry', skipped: 'nothing_eligible_yet_after_refresh' });
      continue;
    }

    if (payAmount < minPayout) {
      results.push({
        cleanerId: cid,
        phase: 'retry',
        skipped: `below_minimum_${minPayout}_cents_after_refresh`,
      });
      continue;
    }

    if (await mustBlockPayoutForRefundedBookingEarnings(supabase, cid, 'retry')) {
      results.push({ cleanerId: cid, phase: 'retry', skipped: 'refunded_booking_earning_conflict' });
      continue;
    }

    const idem = buildRetryPayoutIdempotencyKey(cid, fr.id, now);
    const r = await runPayoutAttempt(supabase, {
      cleanerId: cid,
      recipientCode: recipient,
      payAmount,
      idempotencyKey: idem,
      payoutBatchId: payoutRunBatchId,
      minPayout,
      maxRetries: maxR,
      retryDelaySeconds: delaySec,
      phase: 'retry',
    });
    results.push({ cleanerId: cid, phase: 'retry', ...r });
  }

  return NextResponse.json({
    ok: true,
    stale_recovered: staleCount ?? 0,
    processed_cleaners: (cleaners || []).length,
    minPayoutCents: minPayout,
    payout_run_batch_id: payoutRunBatchId,
    results,
  });
}

async function runPayoutAttempt(
  supabase: ReturnType<typeof createServiceClient>,
  args: {
    cleanerId: string;
    recipientCode: string;
    payAmount: number;
    idempotencyKey: string;
    /** Correlates all attempts from this cron run (see wallet_transactions.payout_batch_id). */
    payoutBatchId: string;
    minPayout: number;
    maxRetries: number;
    retryDelaySeconds: number;
    phase: 'scheduled' | 'retry';
  }
): Promise<{
  skipped?: string;
  amountCents?: number;
  reference?: string;
  error?: string;
}> {
  const {
    cleanerId,
    recipientCode,
    payAmount,
    idempotencyKey,
    payoutBatchId,
    minPayout,
    maxRetries,
    retryDelaySeconds,
    phase,
  } = args;

  if (payAmount < minPayout) {
    return { skipped: `below_minimum_${minPayout}_cents` };
  }

  const { data: initData, error: initErr } = await supabase.rpc('initiate_payout_processing', {
    p_cleaner_id: cleanerId,
    p_amount: payAmount,
    p_idempotency_key: idempotencyKey,
    p_payout_batch_id: payoutBatchId,
  });

  if (initErr) {
    const msg = initErr.message || '';
    if (msg.includes('cleaner_has_processing_payout')) {
      return { skipped: 'already_processing' };
    }
    if (msg.includes('insufficient_wallet_balance')) {
      return { skipped: 'insufficient_wallet_balance' };
    }
    if (msg.includes('idempotency_key_consumed_after_failure')) {
      return { skipped: 'bad_idempotency_key' };
    }
    if (msg.includes('Payout exceeds eligible amount')) {
      await logPayoutEvent({
        eventType: 'payout_exceeds_eligible_blocked',
        cleanerId,
        idempotencyKey,
        level: 'warn',
        payload: { phase, note: 'db_guard_eligible_lt_requested_amount' },
      });
      return { skipped: 'payout_exceeds_eligible' };
    }
    await logPayoutEvent({
      eventType: 'initiate_payout_error',
      cleanerId,
      idempotencyKey,
      level: 'error',
      payload: { message: msg, phase },
    });
    return { error: msg };
  }

  const parsed = parseInitiateResult(initData);
  if (!parsed) {
    await logPayoutEvent({
      eventType: 'initiate_payout_bad_shape',
      cleanerId,
      idempotencyKey,
      level: 'error',
      payload: { initData, phase },
    });
    return { error: 'initiate_payout_bad_response' };
  }

  if (parsed.is_duplicate) {
    await logPayoutEvent({
      eventType: 'payout_duplicate_cron_run',
      cleanerId,
      idempotencyKey,
      payload: { phase },
    });
    return { skipped: 'duplicate_idempotent', reference: idempotencyKey };
  }

  const transfer = await sendPaystackTransfer({
    amountCents: payAmount,
    recipientCode: recipientCode,
    reference: idempotencyKey,
    reason: `Shalean payout ${phase} ${new Date().toISOString().slice(0, 10)}`,
  });

  if (!transfer.ok) {
    await logPayoutEvent({
      eventType: 'paystack_transfer_api_failed',
      cleanerId,
      walletTransactionId: parsed.wallet_tx_id,
      idempotencyKey,
      level: 'warn',
      payload: { message: transfer.message, phase },
    });

    const { error: failErr } = await supabase.rpc('fail_payout_processing', {
      p_wallet_tx_id: parsed.wallet_tx_id,
      p_error_message: transfer.message,
      p_max_retries: maxRetries,
      p_retry_delay_seconds: retryDelaySeconds,
    });

    if (failErr) {
      await logPayoutEvent({
        eventType: 'fail_payout_processing_rpc_error',
        cleanerId,
        walletTransactionId: parsed.wallet_tx_id,
        level: 'error',
        payload: { message: failErr.message },
      });
    }

    return { error: transfer.message };
  }

  await logPayoutEvent({
    eventType: 'paystack_transfer_initiated_await_webhook',
    cleanerId,
    walletTransactionId: parsed.wallet_tx_id,
    idempotencyKey,
    payload: {
      paystack_reference: transfer.reference,
      transfer_code: transfer.transferCode ?? null,
      phase,
    },
  });

  return {
    amountCents: payAmount,
    reference: transfer.reference,
  };
}

function scheduleMatchesToday(
  schedule: 'weekly' | 'monthly',
  payoutDay: number,
  now: Date
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
