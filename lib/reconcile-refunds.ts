/**
 * Compare local booking payment state vs Paystack transaction status (refund / reversal drift).
 * Does not log PII — only booking ids and payment references.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logPayoutEvent } from '@/lib/payout-log';
import { isExcludedFromRevenueReporting } from '@/lib/booking-revenue-exclusion';

export type RefundMismatchRow = {
  booking_id: string;
  reference: string;
  kind: 'local_paid_paystack_reversed' | 'local_refunded_paystack_success';
  local_payment_status: string;
  paystack_status: string;
};

function requirePaystackSecret(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

async function fetchPaystackTransactionStatus(
  secret: string,
  reference: string
): Promise<{ status: string | null; ok: boolean }> {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    data?: { status?: string };
  };
  if (!res.ok || json?.status !== true || !json.data) {
    return { status: null, ok: false };
  }
  const st = json.data.status;
  return {
    status: typeof st === 'string' ? st.toLowerCase() : null,
    ok: true,
  };
}

function pickReference(row: {
  paystack_ref?: string | null;
  payment_reference?: string | null;
}): string | null {
  const a = row.paystack_ref?.trim();
  const b = row.payment_reference?.trim();
  return a || b || null;
}

/**
 * Scan recent bookings with a Paystack reference and flag drift vs Paystack.
 */
export async function reconcilePaystackRefundsVsLocalBookings(
  supabase: SupabaseClient,
  options?: { limit?: number; pauseMs?: number }
): Promise<{ scanned: number; mismatches: RefundMismatchRow[] }> {
  const limit = Math.min(Math.max(1, options?.limit ?? 80), 500);
  const pauseMs = Math.max(0, options?.pauseMs ?? 60);
  const secret = requirePaystackSecret();

  const { data: rows, error } = await supabase
    .from('bookings')
    .select('id, payment_status, status, paystack_ref, payment_reference')
    .or('paystack_ref.not.is.null,payment_reference.not.is.null')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const mismatches: RefundMismatchRow[] = [];
  let scanned = 0;

  for (const row of rows || []) {
    const ref = pickReference(row);
    if (!ref) continue;
    scanned += 1;

    const localPs = String(row.payment_status || '').toLowerCase();
    const { status: paystackStatus, ok } = await fetchPaystackTransactionStatus(secret, ref);
    if (pauseMs) await new Promise((r) => setTimeout(r, pauseMs));

    if (!ok || !paystackStatus) continue;

    const localExcluded = isExcludedFromRevenueReporting({
      payment_status: row.payment_status,
      status: (row as { status?: string | null }).status,
    });
    const paystackPaid = paystackStatus === 'success';
    const paystackReversed = paystackStatus === 'reversed';

    if (!localExcluded && paystackReversed) {
      const m: RefundMismatchRow = {
        booking_id: row.id,
        reference: ref,
        kind: 'local_paid_paystack_reversed',
        local_payment_status: localPs || '(empty)',
        paystack_status: paystackStatus,
      };
      mismatches.push(m);
      await logPayoutEvent({
        eventType: 'refund_mismatch_detected',
        level: 'warn',
        payload: {
          booking_id: m.booking_id,
          reference: m.reference,
          kind: m.kind,
        },
      });
    } else if (localPs === 'refunded' && paystackPaid) {
      const m: RefundMismatchRow = {
        booking_id: row.id,
        reference: ref,
        kind: 'local_refunded_paystack_success',
        local_payment_status: localPs,
        paystack_status: paystackStatus,
      };
      mismatches.push(m);
      await logPayoutEvent({
        eventType: 'refund_mismatch_detected',
        level: 'warn',
        payload: {
          booking_id: m.booking_id,
          reference: m.reference,
          kind: m.kind,
        },
      });
    }
  }

  return { scanned, mismatches };
}
