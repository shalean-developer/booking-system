import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { verifyPaystackWebhookSignature } from '@/lib/paystack-webhook';
import { logPayoutEvent } from '@/lib/payout-log';
import { getPayoutMaxRetries, getPayoutRetryBaseDelaySeconds } from '@/lib/payout-config';
import { notifyCleanerPayoutOutcome } from '@/lib/notifications/payout-notify';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/paystack
 * Confirms transfer success/failure — source of truth after initiate + Paystack async state.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    await logPayoutEvent({
      eventType: 'webhook_signature_invalid',
      level: 'warn',
      payload: { has_sig: !!signature },
    });
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  let body: { event?: string; data?: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody) as { event?: string; data?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const event = (body.event || '').toLowerCase();
  const data = body.data || {};
  const reference =
    (typeof data.reference === 'string' && data.reference) ||
    (typeof (data as { transfer?: { reference?: string } }).transfer?.reference === 'string' &&
      (data as { transfer?: { reference?: string } }).transfer?.reference) ||
    '';

  await logPayoutEvent({
    eventType: `webhook_${event || 'unknown'}`,
    idempotencyKey: reference || null,
    payload: { event: body.event, reference: reference || null },
  });

  if (!reference) {
    await logPayoutEvent({
      eventType: 'webhook_missing_reference',
      level: 'warn',
      payload: { event: body.event },
    });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createServiceClient();
  const maxR = getPayoutMaxRetries();
  const delaySec = getPayoutRetryBaseDelaySeconds();

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
      await logPayoutEvent({
        eventType: 'complete_payout_rpc_error',
        level: 'error',
        idempotencyKey: reference,
        payload: { message: error.message },
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (tid == null) {
      await logPayoutEvent({
        eventType: 'complete_payout_idempotent_noop',
        idempotencyKey: reference,
        payload: { note: 'no processing row or already finalized' },
      });
    } else {
      await logPayoutEvent({
        eventType: 'payout_completed',
        walletTransactionId: String(tid),
        idempotencyKey: reference,
      });

      const { data: row } = await supabase
        .from('wallet_transactions')
        .select('cleaner_id, amount')
        .eq('id', tid)
        .maybeSingle();
      if (row?.cleaner_id) {
        await notifyCleanerPayoutOutcome({
          cleanerId: row.cleaner_id,
          success: true,
          amountCents: Number(row.amount),
          idempotencyKey: reference,
          paystackReference: typeof paystackRef === 'string' ? paystackRef : reference,
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  if (
    event === 'transfer.failed' ||
    event === 'transfer.reversed' ||
    event === 'transfer.failed_processing'
  ) {
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
      await logPayoutEvent({
        eventType: 'fail_payout_webhook_rpc_error',
        level: 'error',
        idempotencyKey: reference,
        payload: { message: error.message },
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await logPayoutEvent({
      eventType: ok ? 'payout_failed_refunded' : 'fail_payout_noop',
      idempotencyKey: reference,
      payload: { refunded: !!ok, reason },
    });

    if (ok) {
      const { data: row } = await supabase
        .from('wallet_transactions')
        .select('cleaner_id, amount')
        .eq('idempotency_key', reference)
        .eq('type', 'payout')
        .maybeSingle();
      if (row?.cleaner_id) {
        await notifyCleanerPayoutOutcome({
          cleanerId: row.cleaner_id,
          success: false,
          amountCents: Number(row.amount),
          idempotencyKey: reference,
          reason,
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
