/**
 * Paystack verification helpers + booking lookup for payment flows.
 * Fulfillment lives in lib/payments/fulfillBooking.ts (single pipeline).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingPaidRow } from '@/lib/payments/booking-types';
import { parseBookingIdFromBookingPrefixedReference } from '@/lib/payment-reference';

export type { BookingPaidRow } from '@/lib/payments/booking-types';

export {
  fulfillPaidBooking,
  fulfillBooking,
  finalizeBookingPayment,
  finalizePaidBookingServer,
  type FulfillPaidBookingResult,
} from '@/lib/payments/fulfillBooking';

/**
 * Core columns for payment verify / finalize. `manage_token` is loaded separately so older DBs without the column still work until migrations run.
 * Do not select `bedrooms` / `bathrooms` / `extras` — many deployments only store those inside `price_snapshot` (pending insert does not denormalize them).
 */
const SELECT_COLS =
  'id, customer_id, points_redeemed, cleaner_id, booking_date, booking_time, expected_end_time, service_type, customer_name, customer_email, customer_phone, address_line1, address_suburb, address_city, total_amount, price, tip_amount, service_fee, frequency_discount, frequency, surge_pricing_applied, surge_amount, requires_team, notes, price_snapshot, status, payment_reference, paystack_ref, zoho_invoice_id, invoice_url, payment_status, equipment_required, equipment_fee, pricing_snapshot_id';

export async function paystackVerifyTransaction(
  secretKey: string,
  reference: string,
): Promise<{ ok: boolean; amountKobo: number; currency?: string }> {
  const detailed = await paystackVerifyDetailed(secretKey, reference);
  if (detailed.outcome !== 'success') {
    return { ok: false, amountKobo: 0 };
  }
  return { ok: true, amountKobo: detailed.amountKobo, currency: detailed.currency };
}

/** Full Paystack verify response — use for polling to avoid false failures while status is still pending. */
export type PaystackVerifyDetailed =
  | { outcome: 'success'; amountKobo: number; currency: string }
  | { outcome: 'pending'; detail?: string }
  | { outcome: 'failed'; reason: string };

export type PaystackVerifyOptions = {
  /**
   * When true (payment status polling only): Paystack sometimes returns 404 / "transaction reference not found"
   * for a short window after a successful charge while the transaction is indexed. Treat as pending so the
   * client can keep polling instead of showing a false failure.
   */
  notFoundAsPending?: boolean;
};

export async function paystackVerifyDetailed(
  secretKey: string,
  reference: string,
  options?: PaystackVerifyOptions,
): Promise<PaystackVerifyDetailed> {
  const soft404 = options?.notFoundAsPending === true;
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      gateway_response?: string;
    };
  };

  if (!res.ok) {
    const msg = json.message || `Paystack HTTP ${res.status}`;
    const isNotFoundCase = res.status === 404 || /not\s*found/i.test(msg);
    if (isNotFoundCase) {
      if (soft404) {
        return { outcome: 'pending', detail: msg };
      }
      return { outcome: 'failed', reason: msg };
    }
    // Transient or still indexing — prefer pending over hard fail
    return { outcome: 'pending', detail: msg };
  }

  if (!json.data) {
    return {
      outcome: 'failed',
      reason: json.message || 'Invalid verification response',
    };
  }

  const d = json.data;
  const st = (d.status || '').toLowerCase();

  if (st === 'success') {
    const amountKobo = Number(d.amount);
    const cur = String(d.currency || 'ZAR').trim().toUpperCase();
    return {
      outcome: 'success',
      amountKobo: Number.isFinite(amountKobo) ? amountKobo : 0,
      currency: cur.length > 0 ? cur : 'ZAR',
    };
  }

  if (st === 'failed' || st === 'abandoned' || st === 'reversed') {
    return {
      outcome: 'failed',
      reason: d.gateway_response || json.message || 'Payment was not successful',
    };
  }

  return {
    outcome: 'pending',
    detail: d.gateway_response || json.message || 'Payment not confirmed yet',
  };
}

/**
 * Payment status polling: verify against Paystack using the callback reference first, then any refs
 * already stored on the booking (webhook may have run before the browser polls). Uses soft 404 handling
 * so a briefly missing transaction does not surface as an immediate hard error.
 */
export async function verifyPaystackTransactionForBookingPoll(
  secretKey: string,
  primaryReference: string,
  booking: BookingPaidRow,
): Promise<{
  detailed: PaystackVerifyDetailed;
  /** Set when verification succeeds — use for finalize / emails */
  verifiedReference: string | null;
}> {
  const refs: string[] = [];
  const push = (r: string | null | undefined) => {
    const t = (r ?? '').trim();
    if (t && !refs.includes(t)) refs.push(t);
  };
  push(primaryReference);
  push(booking.paystack_ref);
  push(booking.payment_reference);

  let lastFailed: PaystackVerifyDetailed | null = null;
  let anyPending: PaystackVerifyDetailed | null = null;
  for (const ref of refs) {
    const detailed = await paystackVerifyDetailed(secretKey, ref, { notFoundAsPending: true });
    if (detailed.outcome === 'success') {
      return { detailed, verifiedReference: ref };
    }
    if (detailed.outcome === 'pending') {
      anyPending = detailed;
    } else {
      lastFailed = detailed;
    }
  }
  if (anyPending) {
    return { detailed: anyPending, verifiedReference: null };
  }
  return {
    detailed: lastFailed ?? { outcome: 'failed', reason: 'Could not verify payment' },
    verifiedReference: null,
  };
}

export { parseBookingIdFromBookingPrefixedReference } from '@/lib/payment-reference';

/** True when the booking row reflects a completed payment (webhook / fulfill pipeline). */
export function isBookingPaidInDatabase(
  booking: Pick<BookingPaidRow, 'status' | 'payment_status'>,
): boolean {
  const st = String(booking.status || '').toLowerCase();
  if (st === 'paid') return true;
  const ps = String(booking.payment_status || '').toLowerCase();
  return ps === 'success' || ps === 'paid';
}

/** Latest row for polling — avoids stale reads when the Paystack webhook just updated the booking. */
export async function fetchBookingForPaymentVerificationById(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<BookingPaidRow | null> {
  const { data } = await supabase.from('bookings').select(SELECT_COLS).eq('id', bookingId).maybeSingle();
  return (data as BookingPaidRow) ?? null;
}

export async function fetchBookingForPaymentVerification(
  supabase: SupabaseClient,
  reference: string,
): Promise<BookingPaidRow | null> {
  if (reference.startsWith('booking-')) {
    const idFromRef = parseBookingIdFromBookingPrefixedReference(reference);
    if (idFromRef) {
      const { data: byPref } = await supabase
        .from('bookings')
        .select(SELECT_COLS)
        .eq('id', idFromRef)
        .maybeSingle();
      if (byPref) return byPref as BookingPaidRow;
    }
  }

  const { data: byId } = await supabase
    .from('bookings')
    .select(SELECT_COLS)
    .eq('id', reference)
    .maybeSingle();
  if (byId) return byId as BookingPaidRow;

  const { data: byPaystack } = await supabase
    .from('bookings')
    .select(SELECT_COLS)
    .eq('paystack_ref', reference)
    .maybeSingle();
  if (byPaystack) return byPaystack as BookingPaidRow;

  const { data: byLegacy } = await supabase
    .from('bookings')
    .select(SELECT_COLS)
    .eq('payment_reference', reference)
    .maybeSingle();

  return (byLegacy as BookingPaidRow) ?? null;
}

export function referenceMatchesBooking(booking: BookingPaidRow, reference: string): boolean {
  if (reference === booking.id) return true;
  if (reference === `booking-${booking.id}`) return true;
  const parsed = parseBookingIdFromBookingPrefixedReference(reference);
  if (parsed && parsed === booking.id) return true;
  if (booking.paystack_ref && reference === booking.paystack_ref) return true;
  if (booking.payment_reference && reference === booking.payment_reference) return true;
  return false;
}

export async function resolveBookingForVerify(
  supabase: SupabaseClient,
  referenceParam: string,
  bookingIdHint: string | null,
): Promise<{ booking: BookingPaidRow | null; error?: string }> {
  let booking: BookingPaidRow | null = null;

  if (bookingIdHint) {
    const { data, error } = await supabase
      .from('bookings')
      .select(SELECT_COLS)
      .eq('id', bookingIdHint)
      .maybeSingle();
    if (error) {
      return { booking: null, error: error.message };
    }
    booking = data as BookingPaidRow | null;
  }

  if (!booking) {
    booking = await fetchBookingForPaymentVerification(supabase, referenceParam);
  }

  if (!booking) {
    return { booking: null };
  }

  if (!referenceMatchesBooking(booking, referenceParam)) {
    return { booking: null, error: 'reference must match this booking' };
  }

  return { booking };
}
