/**
 * Paystack → Next.js webhook (PRIMARY for charge.* events).
 *
 * Charge events are handled exclusively by this Next.js route.
 * Supabase Edge `paystack-webhook` returns 200 without processing charge.* (see that file).
 * Cleaner payout transfers: POST /api/webhooks/paystack
 *
 * Event order: refund.processed first (same POST), then charge.success; refund state wins over charge on the booking row.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';
import {
  fetchBookingForPaymentVerification,
  finalizeBookingPayment,
  paystackVerifyDetailed,
  referenceMatchesBooking,
} from '@/lib/booking-paid-server';
import { logPaymentIntegrity, redactPaymentReference } from '@/lib/payment-integrity-log';
import { recordPaymentValidationFailure } from '@/lib/payment-validation-tracker';
import type { SupabaseClient } from '@supabase/supabase-js';

const WEBHOOK_SOURCE = 'nextjs' as const;

function logPaymentWebhook(payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      module: 'paystack_payment_webhook',
      webhook_source: WEBHOOK_SOURCE,
      ...payload,
    }),
  );
}

type BookingRefRow = {
  id: string;
  status: string;
  total_amount: number | null;
  customer_name: string | null;
  customer_email: string | null;
  payment_status: string | null;
};

const BOOKING_REF_SELECT = 'id, status, total_amount, customer_name, customer_email, payment_status';

async function findBookingByPaystackReference(
  supabase: SupabaseClient,
  reference: string,
): Promise<BookingRefRow | null> {
  if (reference.startsWith('booking-')) {
    const id = reference.slice('booking-'.length);
    const { data } = await supabase.from('bookings').select(BOOKING_REF_SELECT).eq('id', id).maybeSingle();
    if (data) return data as BookingRefRow;
  }
  const { data: byId } = await supabase.from('bookings').select(BOOKING_REF_SELECT).eq('id', reference).maybeSingle();
  if (byId) return byId as BookingRefRow;
  const { data: byPaystack } = await supabase
    .from('bookings')
    .select(BOOKING_REF_SELECT)
    .eq('paystack_ref', reference)
    .maybeSingle();
  if (byPaystack) return byPaystack as BookingRefRow;
  const { data: byRef } = await supabase
    .from('bookings')
    .select(BOOKING_REF_SELECT)
    .eq('payment_reference', reference)
    .maybeSingle();
  return (byRef as BookingRefRow | null) ?? null;
}

/** Paystack refund payload — original charge reference may live on transaction_reference or nested transaction. */
function extractRefundOriginalReference(data: Record<string, unknown> | null | undefined): string | null {
  if (!data || typeof data !== 'object') return null;
  const tr = data.transaction_reference;
  if (typeof tr === 'string' && tr.trim()) return tr.trim();
  const transaction = data.transaction;
  if (transaction && typeof transaction === 'object') {
    const ref = (transaction as { reference?: string }).reference;
    if (typeof ref === 'string' && ref.trim()) return ref.trim();
  }
  const r = data.reference;
  if (typeof r === 'string' && r.trim()) return r.trim();
  return null;
}

function refundWebhookIdempotencyKey(
  data: Record<string, unknown> | null | undefined,
  originalTransactionReference: string,
): string {
  const id = data?.id;
  if (typeof id === 'number' && Number.isFinite(id)) {
    return `refund.processed:id:${id}`;
  }
  if (typeof id === 'string' && id.trim()) {
    return `refund.processed:id:${id.trim()}`;
  }
  return `refund.processed:tx:${originalTransactionReference}`;
}

/**
 * Paystack refund.processed — claim idempotency row before mutating booking (reduces double-refund races).
 * Sets payment_status + blocks payout; wallet balance reversal (if already credited) is out of scope here.
 */
async function processRefundProcessed(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<NextResponse> {
  const data = payload.data as Record<string, unknown> | undefined;
  const originalRef = extractRefundOriginalReference(data);
  if (!originalRef) {
    logPaymentWebhook({ event_type: 'refund_missing_reference', level: 'warn' });
    return NextResponse.json({ ok: false, error: 'Missing transaction reference' }, { status: 400 });
  }

  const idempotencyKey = refundWebhookIdempotencyKey(data, originalRef);

  const booking = await findBookingByPaystackReference(supabase, originalRef);
  if (!booking) {
    logPaymentWebhook({ event_type: 'refund_no_booking', ref_len: originalRef.length });
    return NextResponse.json({ ok: true, message: 'No matching booking for refund reference' });
  }

  if (String(booking.payment_status || '').toLowerCase() === 'refunded') {
    logPaymentWebhook({ event_type: 'refund_already_applied', booking_id: booking.id });
    return NextResponse.json({ ok: true, duplicate: true, message: 'Booking already refunded' });
  }

  const { error: insertErr } = await supabase.from('paystack_webhook_events').insert({
    idempotency_key: idempotencyKey,
    paystack_reference: originalRef,
    event_type: 'refund.processed',
  });

  if (insertErr) {
    const code = (insertErr as { code?: string }).code;
    if (code === '23505') {
      const latest = await findBookingByPaystackReference(supabase, originalRef);
      if (
        latest &&
        String(latest.payment_status || '').toLowerCase() !== 'refunded'
      ) {
        logPaymentWebhook({
          event_type: 'refund_idempotency_repair',
          booking_id: latest.id,
          level: 'warn',
        });
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            payment_status: 'refunded',
            payout_status: 'blocked',
            updated_at: new Date().toISOString(),
          })
          .eq('id', latest.id);
      } else {
        logPaymentWebhook({
          event_type: 'refund_duplicate_ignored',
          idempotency_prefix: idempotencyKey.slice(0, 40),
        });
      }
      return NextResponse.json({ ok: true, duplicate: true, message: 'Already processed' });
    }
    logPaymentWebhook({ event_type: 'refund_idempotency_insert_failed', level: 'error' });
    return NextResponse.json({ ok: false, error: 'Idempotency error' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      payment_status: 'refunded',
      payout_status: 'blocked',
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  if (updateError) {
    await supabase.from('paystack_webhook_events').delete().eq('idempotency_key', idempotencyKey);
    logPaymentWebhook({ event_type: 'refund_booking_update_failed', level: 'error' });
    return NextResponse.json({ ok: false, error: 'Failed to update booking' }, { status: 500 });
  }

  logPaymentWebhook({
    event_type: 'refund_processed_ok',
    booking_id: booking.id,
  });

  return NextResponse.json({
    ok: true,
    message: 'Booking marked refunded',
    booking_id: booking.id,
  });
}

export const dynamic = 'force-dynamic';

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    /** Paystack smallest currency unit (ZAR: cents; same convention as booking.total_amount). */
    amount?: number;
    currency?: string;
    paid_at?: string;
    gateway_response?: string;
    customer?: {
      email: string;
    };
    authorization?: {
      authorization_code?: string;
      reusable?: boolean;
      signature?: string;
      last4?: string;
      exp_month?: string;
      exp_year?: string;
      card_type?: string;
      brand?: string;
      bank?: string;
    };
    metadata?: {
      custom_fields?: Array<{
        variable_name: string;
        value: string;
      }>;
    };
  };
}

function verifyPaystackSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    return hash === signature;
  } catch (error) {
    console.error('Error verifying Paystack signature:', error);
    return false;
  }
}

async function claimChargeWebhookIdempotency(
  supabase: SupabaseClient,
  idempotencyKey: string,
  paystackReference: string,
  eventType: string,
): Promise<'inserted' | 'duplicate' | 'error'> {
  const { error } = await supabase.from('paystack_webhook_events').insert({
    idempotency_key: idempotencyKey,
    paystack_reference: paystackReference,
    event_type: eventType,
  });
  if (!error) return 'inserted';
  const code = (error as { code?: string }).code;
  if (code === '23505') return 'duplicate';
  logPaymentWebhook({ event_type: 'idempotency_insert_error', message: error.message, level: 'error' });
  return 'error';
}

async function releaseChargeWebhookIdempotency(supabase: SupabaseClient, idempotencyKey: string): Promise<void> {
  await supabase.from('paystack_webhook_events').delete().eq('idempotency_key', idempotencyKey);
}

export async function POST(request: NextRequest) {
  logPaymentWebhook({ event_type: 'webhook_received', webhook_source: WEBHOOK_SOURCE });

  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      logPaymentWebhook({ event_type: 'config_error', level: 'error', detail: 'missing_paystack_secret' });
      return NextResponse.json({ ok: false, error: 'Webhook not configured' }, { status: 500 });
    }

    const signature = request.headers.get('x-paystack-signature');
    if (!signature) {
      logPaymentWebhook({ event_type: 'auth_error', level: 'warn', detail: 'missing_signature' });
      return NextResponse.json({ ok: false, error: 'Missing signature' }, { status: 401 });
    }

    const body = await request.text();
    const isValid = verifyPaystackSignature(body, signature, paystackSecretKey);
    if (!isValid) {
      logPaymentWebhook({ event_type: 'auth_error', level: 'warn', detail: 'invalid_signature' });
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body) as Record<string, unknown>;
    const eventType = typeof payload.event === 'string' ? payload.event : '';

    const supabase = createServiceClient();

    if (eventType === 'refund.processed') {
      return processRefundProcessed(supabase, payload);
    }

    if (eventType.startsWith('transfer.')) {
      logPaymentWebhook({
        event_type: 'transfer_event_ignored_here',
        detail: 'use_api_webhooks_paystack',
      });
      return NextResponse.json({
        ok: true,
        ignored: true,
        message: 'Transfer webhooks are handled by POST /api/webhooks/paystack',
      });
    }

    if (!eventType.startsWith('charge.')) {
      logPaymentWebhook({ event_type: 'non_charge_ignored', event: eventType });
      return NextResponse.json({ ok: true, message: 'Event ignored' });
    }

    const event = payload as unknown as PaystackWebhookEvent;
    const paymentReference = event.data?.reference?.trim();
    if (!paymentReference) {
      logPaymentWebhook({ event_type: 'charge_missing_reference', level: 'error' });
      return NextResponse.json({ ok: false, error: 'Missing payment reference' }, { status: 400 });
    }

    const successKey = `charge.success:${paymentReference}`;

    if (eventType === 'charge.success' && event.data?.status === 'success') {
      const ins = await claimChargeWebhookIdempotency(
        supabase,
        successKey,
        paymentReference,
        eventType,
      );
      if (ins === 'duplicate') {
        logPaymentWebhook({
          event_type: 'charge_duplicate_ignored',
          reference_len: paymentReference.length,
        });
        return NextResponse.json({ ok: true, duplicate: true, message: 'Already processed' });
      }
      if (ins === 'error') {
        return NextResponse.json({ ok: false, error: 'Idempotency error' }, { status: 500 });
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('recurring_invoices')
        .select('id, status, customer_id')
        .eq('payment_reference', paymentReference)
        .maybeSingle();

      if (invoiceError) {
        await releaseChargeWebhookIdempotency(supabase, successKey);
        logPaymentWebhook({ event_type: 'invoice_lookup_error', level: 'error' });
        return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
      }

      if (invoice?.id) {
        const invCurrency = String(event.data?.currency ?? '').trim().toUpperCase();
        if (invCurrency !== 'ZAR') {
          logPaymentIntegrity({
            event_type: 'invalid_currency',
            target: 'recurring_invoice',
            reference_redacted: redactPaymentReference(paymentReference),
            currency: invCurrency || '(empty)',
          });
          await recordPaymentValidationFailure(supabase, paymentReference, 'invalid_currency');
          return NextResponse.json({ ok: true, message: 'Invalid currency for invoice' });
        }

        const auth = event.data?.authorization;
        if (auth?.authorization_code && invoice.customer_id) {
          try {
            await supabase
              .from('customers')
              .update({
                paystack_authorization_code: auth.authorization_code,
                paystack_authorization_email: event.data?.customer?.email || null,
                paystack_authorization_reusable: auth.reusable ?? null,
                paystack_authorization_signature: auth.signature ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', invoice.customer_id);
          } catch (e) {
            console.error('Failed to store Paystack authorization for invoice customer:', e);
          }
        }

        const { error: updateInvoiceError } = await supabase
          .from('recurring_invoices')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.id);

        if (updateInvoiceError) {
          logPaymentWebhook({ event_type: 'invoice_update_failed', level: 'error' });
          return NextResponse.json({ ok: false, error: 'Failed to update invoice' }, { status: 500 });
        }

        logPaymentWebhook({
          event_type: 'charge_success_processed',
          target: 'recurring_invoice',
          invoice_id: invoice.id,
        });
        return NextResponse.json({
          ok: true,
          message: 'Invoice updated successfully',
          invoice_id: invoice.id,
        });
      }

      const verified = await paystackVerifyDetailed(paystackSecretKey, paymentReference);
      if (verified.outcome === 'pending') {
        await releaseChargeWebhookIdempotency(supabase, successKey);
        logPaymentWebhook({ event_type: 'charge_verify_pending', level: 'warn' });
        return NextResponse.json(
          { ok: false, error: 'Verify pending', detail: verified.detail },
          { status: 503 },
        );
      }
      if (verified.outcome === 'failed') {
        await releaseChargeWebhookIdempotency(supabase, successKey);
        logPaymentWebhook({ event_type: 'charge_verify_failed', level: 'warn' });
        return NextResponse.json({ ok: false, error: verified.reason }, { status: 400 });
      }

      const booking = await fetchBookingForPaymentVerification(supabase, paymentReference);
      if (!booking) {
        await releaseChargeWebhookIdempotency(supabase, successKey);
        logPaymentWebhook({ event_type: 'charge_no_booking', reference_len: paymentReference.length });
        return NextResponse.json({
          ok: true,
          message: 'No matching booking for this reference',
        });
      }

      if (!referenceMatchesBooking(booking, paymentReference)) {
        logPaymentIntegrity({
          event_type: 'finalize_skipped_invalid_state',
          reason: 'payment_reference_mismatch',
          booking_id: booking.id,
          reference_redacted: redactPaymentReference(paymentReference),
        });
        await recordPaymentValidationFailure(supabase, paymentReference, 'payment_reference_mismatch');
        return NextResponse.json({ ok: true, message: 'Payment reference does not match booking' });
      }

      const currency = String(event.data?.currency ?? '').trim().toUpperCase();
      if (currency !== 'ZAR') {
        logPaymentIntegrity({
          event_type: 'invalid_currency',
          reference_redacted: redactPaymentReference(paymentReference),
          currency: currency || '(empty)',
        });
        await recordPaymentValidationFailure(supabase, paymentReference, 'invalid_currency');
        return NextResponse.json({ ok: true, message: 'Invalid currency' });
      }

      const expectedMinor = Math.round(Number(booking.total_amount ?? 0));
      const verifyMinor = verified.amountKobo;
      const rawPayloadAmount = event.data?.amount;
      const payloadMinor =
        rawPayloadAmount != null && Number.isFinite(Number(rawPayloadAmount))
          ? Math.round(Number(rawPayloadAmount))
          : null;
      if (
        payloadMinor != null &&
        Number.isFinite(payloadMinor) &&
        Math.abs(payloadMinor - verifyMinor) > 1
      ) {
        logPaymentIntegrity({
          event_type: 'payment_amount_mismatch',
          booking_id: booking.id,
          reference_redacted: redactPaymentReference(paymentReference),
          expected_amount: verifyMinor,
          amount_paid: payloadMinor,
          detail: 'webhook_payload_vs_verify_api',
        });
        await recordPaymentValidationFailure(supabase, paymentReference, 'payment_amount_mismatch');
        return NextResponse.json({ ok: true, message: 'Amount mismatch' });
      }
      if (!Number.isFinite(verifyMinor) || Math.abs(verifyMinor - expectedMinor) > 1) {
        logPaymentIntegrity({
          event_type: 'payment_amount_mismatch',
          booking_id: booking.id,
          reference_redacted: redactPaymentReference(paymentReference),
          expected_amount: expectedMinor,
          amount_paid: verifyMinor,
          detail: 'booking_total_vs_verify_api',
          unit: 'minor',
        });
        await recordPaymentValidationFailure(supabase, paymentReference, 'payment_amount_mismatch');
        return NextResponse.json({ ok: true, message: 'Amount mismatch' });
      }

      const ps = String(booking.payment_status || '').toLowerCase();
      if (ps === 'refunded') {
        logPaymentWebhook({
          event_type: 'charge_skipped_booking_refunded',
          booking_id: booking.id,
        });
        return NextResponse.json({
          ok: true,
          message: 'Refund already applied; charge not applied',
          booking_id: booking.id,
        });
      }

      if (ps === 'success' || ps === 'paid') {
        logPaymentWebhook({
          event_type: 'booking_already_finalized',
          booking_id: booking.id,
        });
        return NextResponse.json({
          ok: true,
          duplicate: true,
          message: 'Booking already finalized',
          booking_id: booking.id,
        });
      }

      const bookingStatus = String(booking.status || '').toLowerCase();
      if (bookingStatus !== 'pending') {
        logPaymentIntegrity({
          event_type: 'finalize_skipped_invalid_state',
          booking_id: booking.id,
          reason: 'booking_not_pending',
          status: booking.status,
        });
        return NextResponse.json({ ok: true, message: 'Booking is not awaiting payment' });
      }

      const result = await finalizeBookingPayment({
        supabase,
        booking,
        reference: paymentReference,
        paystackAmountKobo: verified.amountKobo,
        paidCurrency: verified.currency,
      });

      if (!result.ok) {
        logPaymentWebhook({
          event_type: 'finalize_failed',
          booking_id: booking.id,
          level: 'error',
          error_code: result.error?.slice(0, 80),
        });
        return NextResponse.json(
          { ok: false, error: result.error ?? 'Fulfillment failed' },
          { status: 400 },
        );
      }

      logPaymentWebhook({
        event_type: 'charge_success_processed',
        booking_id: booking.id,
        duplicate: result.duplicate === true,
        target: 'booking',
      });

      return NextResponse.json({
        ok: true,
        booking_id: booking.id,
        duplicate: result.duplicate === true,
        zoho_invoice_id: result.zoho_invoice_id ?? null,
      });
    }

    if (eventType === 'charge.failed') {
      const failKey = `charge.failed:${paymentReference}`;
      const fin = await claimChargeWebhookIdempotency(supabase, failKey, paymentReference, eventType);
      if (fin === 'duplicate') {
        logPaymentWebhook({
          event_type: 'charge_duplicate_ignored',
          variant: 'charge.failed',
          reference_len: paymentReference.length,
        });
        return NextResponse.json({ ok: true, duplicate: true, message: 'Already processed' });
      }
      if (fin === 'error') {
        return NextResponse.json({ ok: false, error: 'Idempotency error' }, { status: 500 });
      }

      const booking = await findBookingByPaystackReference(supabase, paymentReference);
      if (!booking) {
        await releaseChargeWebhookIdempotency(supabase, failKey);
        logPaymentWebhook({ event_type: 'charge_failed_no_booking', reference_len: paymentReference.length });
        return NextResponse.json({
          ok: true,
          message: 'Booking not found, but webhook processed',
        });
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) {
        logPaymentWebhook({ event_type: 'charge_failed_update_error', booking_id: booking.id, level: 'error' });
        return NextResponse.json({ ok: false, error: 'Failed to update booking' }, { status: 500 });
      }

      logPaymentWebhook({ event_type: 'charge_failed_processed', booking_id: booking.id });
      return NextResponse.json({
        ok: true,
        message: 'Booking updated to cancelled',
        booking_id: booking.id,
      });
    }

    logPaymentWebhook({ event_type: 'charge_subtype_ignored', event: eventType });
    return NextResponse.json({
      ok: true,
      message: 'Event received but not processed',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    logPaymentWebhook({ event_type: 'webhook_exception', level: 'error', detail: message.slice(0, 120) });
    return NextResponse.json(
      {
        ok: false,
        error: 'Webhook processing failed',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Paystack webhook endpoint is active',
    webhook_source: WEBHOOK_SOURCE,
    note: 'Configure Paystack Dashboard → Settings → Webhooks to this URL for charge events only.',
  });
}
