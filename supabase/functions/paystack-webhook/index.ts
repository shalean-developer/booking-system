import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-admin.ts';
import { paystackVerify, verifyPaystackWebhookSignature } from '../_shared/paystack.ts';
import { fetchBookingByPaystackReference, finalizePaidBooking } from '../_shared/booking-paid.ts';

type PaystackChargeEvent = {
  event: string;
  data?: {
    reference?: string;
    status?: string;
    amount?: number;
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')?.trim();
  if (!secret) {
    return jsonResponse({ ok: false, error: 'Not configured' }, 500);
  }

  const signature = req.headers.get('x-paystack-signature');
  const rawBody = await req.text();

  const valid = await verifyPaystackWebhookSignature(rawBody, signature, secret);
  if (!valid) {
    return jsonResponse({ ok: false, error: 'Invalid signature' }, 401);
  }

  let event: PaystackChargeEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  if (event.event !== 'charge.success') {
    return jsonResponse({ ok: true, ignored: true, event: event.event });
  }

  const reference = event.data?.reference;
  if (!reference || event.data?.status !== 'success') {
    return jsonResponse({ ok: false, error: 'Missing reference' }, 400);
  }

  const idempotencyKey = `charge.success:${reference}`;
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from('paystack_webhook_events')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existing?.id) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  const verified = await paystackVerify(secret, reference);
  if (!verified.ok) {
    return jsonResponse({ ok: false, error: 'Verify failed after webhook' }, 400);
  }

  const booking = await fetchBookingByPaystackReference(supabase, reference);
  if (!booking) {
    console.warn('[paystack-webhook] No booking for reference', reference);
    return jsonResponse({ ok: true, message: 'No matching unpaid booking' });
  }

  const result = await finalizePaidBooking({
    supabase,
    booking,
    reference,
    paystackAmountKobo: verified.amount,
  });

  if (!result.ok) {
    console.error('[paystack-webhook] finalize', result.error);
    return jsonResponse({ ok: false, error: result.error ?? 'Finalize failed' }, 500);
  }

  const { error: logErr } = await supabase.from('paystack_webhook_events').insert({
    idempotency_key: idempotencyKey,
    paystack_reference: reference,
    event_type: event.event,
  });

  if (logErr) {
    console.error('[paystack-webhook] idempotency log (non-fatal)', logErr);
  }

  return jsonResponse({
    ok: true,
    booking_id: booking.id,
    duplicate: result.duplicate === true,
    zoho_invoice_id: result.zoho_invoice_id,
  });
});
