import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-admin.ts';
import { paystackVerify } from '../_shared/paystack.ts';
import { finalizePaidBooking } from '../_shared/booking-paid.ts';

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
      reference?: string;
      booking_id?: string;
    } | null;

    const reference = body?.reference?.trim();
    const bookingId = body?.booking_id?.trim();

    if (!reference || !bookingId) {
      return jsonResponse({ ok: false, error: 'reference and booking_id are required' }, 400);
    }

    const expected = `booking-${bookingId}`;
    if (reference !== bookingId && reference !== expected) {
      return jsonResponse({ ok: false, error: 'reference must match this booking' }, 400);
    }

    const verified = await paystackVerify(secret, reference);
    if (!verified.ok) {
      return jsonResponse({ ok: false, error: 'Payment verification failed' }, 400);
    }

    const supabase = getServiceClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        'id, service_type, customer_name, customer_email, total_amount, status, payment_reference, paystack_ref, zoho_invoice_id, payment_status',
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !booking) {
      return jsonResponse({ ok: false, error: 'Booking not found' }, 404);
    }

    const result = await finalizePaidBooking({
      supabase,
      booking,
      reference,
      paystackAmountKobo: verified.amount,
    });

    if (!result.ok) {
      return jsonResponse({ ok: false, error: result.error ?? 'Finalize failed' }, 400);
    }

    return jsonResponse({
      ok: true,
      duplicate: result.duplicate === true,
      booking_id: booking.id,
      zoho_invoice_id: result.zoho_invoice_id ?? null,
      amount_zar: verified.amount / 100,
      service_type: booking.service_type,
      customer_name: booking.customer_name,
    });
  } catch (e) {
    console.error('[verify-payment]', e);
    return jsonResponse(
      { ok: false, error: e instanceof Error ? e.message : 'Verification failed' },
      500,
    );
  }
});
