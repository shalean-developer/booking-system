import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-admin.ts';
import { paystackInitialize } from '../_shared/paystack.ts';

function paystackReferenceForBooking(bookingId: string): string {
  return `booking-${bookingId}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY')?.trim();
    if (!secret) {
      return jsonResponse({ ok: false, error: 'Payment provider not configured' }, 500);
    }

    const body = await req.json().catch(() => null) as {
      booking_id?: string;
    } | null;

    const bookingId = body?.booking_id?.trim();
    if (!bookingId) {
      return jsonResponse({ ok: false, error: 'booking_id is required' }, 400);
    }

    const supabase = getServiceClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, customer_email, total_amount, status, payment_reference, paystack_ref')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !booking) {
      return jsonResponse({ ok: false, error: 'Booking not found' }, 404);
    }

    if (booking.status !== 'pending' || booking.payment_reference || booking.paystack_ref) {
      return jsonResponse({ ok: false, error: 'Booking is not available for payment' }, 409);
    }

    const email = (booking.customer_email || '').trim().toLowerCase();
    if (!email) {
      return jsonResponse({ ok: false, error: 'Booking has no customer email' }, 400);
    }

    const kobo = Math.round(Number(booking.total_amount ?? 0));
    if (!Number.isFinite(kobo) || kobo < 100) {
      return jsonResponse({ ok: false, error: 'Invalid booking amount' }, 400);
    }

    const appBase = Deno.env.get('NEXT_PUBLIC_APP_URL')?.trim()?.replace(/\/$/, '') || '';
    const configured = Deno.env.get('PAYSTACK_CALLBACK_URL')?.trim();
    const callbackUrl = configured
      ? `${configured}${configured.includes('?') ? '&' : '?'}booking_id=${encodeURIComponent(bookingId)}`
      : `${appBase}/booking/payment/callback?booking_id=${encodeURIComponent(bookingId)}`;

    const reference = paystackReferenceForBooking(bookingId);

    const init = await paystackInitialize({
      secretKey: secret,
      email,
      amountKobo: kobo,
      reference,
      callbackUrl,
      metadata: { booking_id: bookingId },
    });

    return jsonResponse({
      ok: true,
      authorization_url: init.authorization_url,
      reference: init.reference,
    });
  } catch (e) {
    console.error('[initialize-payment]', e);
    return jsonResponse(
      { ok: false, error: e instanceof Error ? e.message : 'Initialize failed' },
      500,
    );
  }
});
