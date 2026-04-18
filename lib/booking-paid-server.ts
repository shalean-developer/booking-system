/**
 * Paystack verification helpers + booking lookup for payment flows.
 * Fulfillment lives in lib/payments/fulfillBooking.ts (single pipeline).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingPaidRow } from '@/lib/payments/booking-types';

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
  'id, cleaner_id, booking_date, booking_time, expected_end_time, service_type, customer_name, customer_email, customer_phone, address_line1, address_suburb, address_city, total_amount, price, tip_amount, service_fee, frequency_discount, frequency, surge_pricing_applied, surge_amount, requires_team, notes, price_snapshot, status, payment_reference, paystack_ref, zoho_invoice_id, invoice_url, payment_status, equipment_required, equipment_fee';

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

export async function paystackVerifyDetailed(
  secretKey: string,
  reference: string,
): Promise<PaystackVerifyDetailed> {
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
    if (res.status === 404 || /not\s*found/i.test(msg)) {
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

export async function fetchBookingForPaymentVerification(
  supabase: SupabaseClient,
  reference: string,
): Promise<BookingPaidRow | null> {
  if (reference.startsWith('booking-')) {
    const id = reference.slice('booking-'.length);
    const { data: byPref } = await supabase
      .from('bookings')
      .select(SELECT_COLS)
      .eq('id', id)
      .maybeSingle();
    if (byPref) return byPref as BookingPaidRow;
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
  if (reference === booking.id || reference === `booking-${booking.id}`) return true;
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
