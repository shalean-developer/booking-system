/**
 * Supabase Edge Paystack webhook.
 *
 * Charge events (charge.*) are handled exclusively by the Next.js webhook:
 *   app/api/payment/webhook/route.ts
 *
 * This function returns 200 immediately for charge.* without DB side effects
 * so duplicate Paystack URLs do not double-finalize bookings.
 *
 * Transfer events (payout lifecycle) are handled here when this URL is registered
 * for transfers; production may instead use POST /api/webhooks/paystack on the app host.
 */

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-admin.ts';
import { verifyPaystackWebhookSignature } from '../_shared/paystack.ts';

const WEBHOOK_SOURCE = 'supabase_edge' as const;

function logEdge(payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      module: 'paystack_edge_webhook',
      webhook_source: WEBHOOK_SOURCE,
      ...payload,
    }),
  );
}

function payoutMaxRetries(): number {
  const n = Number(Deno.env.get('PAYOUT_MAX_RETRIES'));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

function payoutRetryDelaySec(): number {
  const n = Number(Deno.env.get('PAYOUT_RETRY_BASE_DELAY_SECONDS'));
  return Number.isFinite(n) && n >= 60 ? Math.floor(n) : 3600;
}

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
    logEdge({ event_type: 'webhook_signature_invalid', level: 'warn' });
    return jsonResponse({ ok: false, error: 'Invalid signature' }, 401);
  }

  let body: { event?: string; data?: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const eventRaw = body.event || '';
  const event = eventRaw.toLowerCase();

  if (event.startsWith('charge.')) {
    logEdge({
      event_type: 'charge_skipped_edge',
      detail: 'charge_events_handled_exclusively_by_nextjs',
      event: eventRaw,
    });
    return jsonResponse({
      ok: true,
      skipped: true,
      webhook_source: WEBHOOK_SOURCE,
      message: 'Charge events handled exclusively by Next.js webhook',
    });
  }

  const data = body.data || {};
  const reference =
    (typeof data.reference === 'string' && data.reference) ||
    (typeof (data as { transfer?: { reference?: string } }).transfer?.reference === 'string' &&
      (data as { transfer?: { reference?: string } }).transfer?.reference) ||
    '';

  if (
    event === 'transfer.success' ||
    event === 'transfer.completed' ||
    event === 'transfer.failed' ||
    event === 'transfer.reversed' ||
    event === 'transfer.failed_processing'
  ) {
    if (!reference) {
      logEdge({ event_type: 'transfer_missing_reference', event: eventRaw, level: 'warn' });
      return jsonResponse({ ok: true, ignored: true });
    }

    const supabase = getServiceClient();
    const maxR = payoutMaxRetries();
    const delaySec = payoutRetryDelaySec();

    if (event === 'transfer.success' || event === 'transfer.completed') {
      const paystackRef =
        (typeof data.transfer_code === 'string' && data.transfer_code) ||
        (typeof data.reference === 'string' && data.reference) ||
        reference;

      const { data: tid, error } = await supabase.rpc('complete_payout_from_webhook', {
        p_idempotency_key: reference,
        p_paystack_reference: paystackRef,
      });

      if (error) {
        logEdge({ event_type: 'complete_payout_rpc_error', level: 'error' });
        return jsonResponse({ ok: false, error: error.message }, 500);
      }

      logEdge({
        event_type: 'transfer_success_processed',
        wallet_tx_id: tid != null ? String(tid) : null,
      });
      return jsonResponse({ ok: true });
    }

    const reason =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.reason === 'string' && data.reason) ||
      event;

    const { data: ok, error } = await supabase.rpc('fail_payout_from_webhook', {
      p_idempotency_key: reference,
      p_error_message: reason,
      p_max_retries: maxR,
      p_retry_delay_seconds: delaySec,
    });

    if (error) {
      logEdge({ event_type: 'fail_payout_rpc_error', level: 'error' });
      return jsonResponse({ ok: false, error: error.message }, 500);
    }

    logEdge({ event_type: 'transfer_failure_processed', refunded: !!ok });
    return jsonResponse({ ok: true });
  }

  logEdge({ event_type: 'event_ignored', event: eventRaw });
  return jsonResponse({ ok: true, ignored: true });
});
