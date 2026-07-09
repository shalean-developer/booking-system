import 'server-only';

import { createServiceClient } from '@/lib/supabase-server';
import { createPaymentLink } from '@/lib/payments/paystack';
import { resolvePublicBaseUrlFromEnv } from '@/lib/public-base-url';
import { createBookingLookupToken } from '@/lib/booking-lookup-token';

/**
 * Initialize Paystack checkout for a booking created from WhatsApp (pending payment).
 * Callback lands on `/api/payments/verify` → redirects to `/payment/status`.
 * Metadata includes `channel=whatsapp` for post-payment WhatsApp confirmation.
 */
export async function initializePaystackForWhatsAppBooking(params: {
  bookingId: string;
  phoneE164: string;
}): Promise<
  | { ok: true; authorization_url: string; reference: string }
  | { ok: false; error: string }
> {
  const supabase = createServiceClient();
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, customer_email, total_amount, status, payment_reference, paystack_ref, pricing_snapshot_id')
    .eq('id', params.bookingId)
    .maybeSingle();

  if (error || !booking) {
    return { ok: false, error: 'Booking not found' };
  }

  if (booking.status !== 'pending' || booking.payment_reference || booking.paystack_ref) {
    return { ok: false, error: 'Booking is not available for payment' };
  }

  const email = (booking.customer_email || '').trim().toLowerCase();
  if (!email) {
    return { ok: false, error: 'Booking has no customer email' };
  }

  const kobo = Math.round(Number(booking.total_amount ?? 0));
  if (!Number.isFinite(kobo) || kobo < 100) {
    return { ok: false, error: 'Invalid booking amount' };
  }

  const meta: Record<string, string> = {
    booking_id: booking.id,
    channel: 'whatsapp',
    phone_e164: params.phoneE164.trim(),
  };

  if (booking.pricing_snapshot_id) {
    const { data: snap, error: snapErr } = await supabase
      .from('booking_pricing_snapshots')
      .select('id, pricing_hash, pricing_version, final_price')
      .eq('id', booking.pricing_snapshot_id)
      .maybeSingle();
    if (snapErr || !snap) {
      return { ok: false, error: 'Pricing snapshot not found' };
    }
    const expectedMinor = Math.round(Number(snap.final_price) * 100);
    if (!Number.isFinite(expectedMinor) || Math.abs(expectedMinor - kobo) > 1) {
      return { ok: false, error: 'Booking amount does not match locked pricing' };
    }
    meta.snapshot_id = snap.id;
    meta.pricing_hash = String(snap.pricing_hash ?? '');
    meta.pricing_version = String(snap.pricing_version ?? '');
  }

  const base = resolvePublicBaseUrlFromEnv();
  if (!base) {
    return {
      ok: false,
      error:
        'Public site URL not configured. Set NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_BASE_URL.',
    };
  }

  const reference = `booking-${booking.id}`;
  const ct = createBookingLookupToken(booking.id);
  let callbackUrl = `${base}/api/payments/verify?reference=${encodeURIComponent(reference)}&ref=${encodeURIComponent(booking.id)}`;
  if (ct) {
    callbackUrl += `&ct=${encodeURIComponent(ct)}`;
  }

  return createPaymentLink({
    email,
    amountKobo: kobo,
    reference,
    callbackUrl,
    metadata: meta,
  });
}
