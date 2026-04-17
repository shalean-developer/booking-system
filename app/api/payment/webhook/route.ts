import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';
import {
  fetchBookingForPaymentVerification,
  fulfillPaidBooking,
  paystackVerifyDetailed,
} from '@/lib/booking-paid-server';
import type { SupabaseClient } from '@supabase/supabase-js';

async function findBookingByPaystackReference(
  supabase: SupabaseClient,
  reference: string,
) {
  if (reference.startsWith('booking-')) {
    const id = reference.slice('booking-'.length);
    const { data } = await supabase
      .from('bookings')
      .select('id, status, total_amount, customer_name, customer_email')
      .eq('id', id)
      .maybeSingle();
    if (data) return data;
  }
  const { data: byRef } = await supabase
    .from('bookings')
    .select('id, status, total_amount, customer_name, customer_email')
    .eq('payment_reference', reference)
    .maybeSingle();
  return byRef ?? null;
}

export const dynamic = 'force-dynamic';

/**
 * Paystack Webhook Handler
 * 
 * This endpoint receives webhook events from Paystack when payments are processed.
 * It updates booking status based on payment confirmation.
 * 
 * Webhook events handled:
 * - charge.success: Payment successful, update booking to completed
 * - charge.failed: Payment failed, update booking status accordingly
 * - refund.processed: Refund processed
 * 
 * Security:
 * - Verifies Paystack webhook signature using secret key
 * - Only processes events from verified Paystack requests
 */

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
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

/**
 * Verify Paystack webhook signature
 */
function verifyPaystackSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');
    
    return hash === signature;
  } catch (error) {
    console.error('Error verifying Paystack signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  console.log('=== PAYSTACK WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Get Paystack secret key
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('❌ PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json(
        { ok: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Get webhook signature from headers
    const signature = request.headers.get('x-paystack-signature');
    if (!signature) {
      console.error('❌ Missing Paystack signature header');
      return NextResponse.json(
        { ok: false, error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Read raw body for signature verification
    const body = await request.text();
    
    // Verify webhook signature
    const isValid = verifyPaystackSignature(body, signature, paystackSecretKey);
    if (!isValid) {
      console.error('❌ Invalid Paystack webhook signature');
      return NextResponse.json(
        { ok: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Webhook signature verified');

    // Parse webhook event
    const event: PaystackWebhookEvent = JSON.parse(body);
    console.log('Event type:', event.event);
    console.log('Payment reference:', event.data?.reference);

    // Only process charge events
    if (!event.event.startsWith('charge.')) {
      console.log('ℹ️ Ignoring non-charge event:', event.event);
      return NextResponse.json({ ok: true, message: 'Event ignored' });
    }

    const paymentReference = event.data?.reference;
    if (!paymentReference) {
      console.error('❌ No payment reference in webhook data');
      return NextResponse.json(
        { ok: false, error: 'Missing payment reference' },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS (webhook is server-to-server)
    const supabase = createServiceClient();

    // 1) Prefer invoice lookup (recurring group payments)
    const { data: invoice, error: invoiceError } = await supabase
      .from('recurring_invoices')
      .select('id, status, customer_id')
      .eq('payment_reference', paymentReference)
      .maybeSingle();

    if (invoiceError) {
      console.error('❌ Error finding invoice:', invoiceError);
      return NextResponse.json(
        { ok: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (invoice?.id) {
      console.log('📦 Found recurring invoice:', invoice.id, 'Current status:', invoice.status);

      // Store Paystack reusable authorization (if present)
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
          console.error('⚠️ Failed to store Paystack authorization for invoice customer:', e);
        }
      }

      if (event.event === 'charge.success' && event.data.status === 'success') {
        const { error: updateInvoiceError } = await supabase
          .from('recurring_invoices')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.id);

        if (updateInvoiceError) {
          console.error('❌ Error updating invoice status:', updateInvoiceError);
          return NextResponse.json(
            { ok: false, error: 'Failed to update invoice' },
            { status: 500 }
          );
        }

        console.log('✅ Invoice status updated to paid');
        return NextResponse.json({
          ok: true,
          message: 'Invoice updated successfully',
          invoice_id: invoice.id,
        });
      }

      if (event.event === 'charge.failed') {
        const { error: updateInvoiceError } = await supabase
          .from('recurring_invoices')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.id);

        if (updateInvoiceError) {
          console.error('❌ Error updating invoice status:', updateInvoiceError);
          return NextResponse.json(
            { ok: false, error: 'Failed to update invoice' },
            { status: 500 }
          );
        }

        console.log('✅ Invoice status updated to failed');
        return NextResponse.json({
          ok: true,
          message: 'Invoice updated to failed',
          invoice_id: invoice.id,
        });
      }

      console.log('ℹ️ Invoice found but event not handled:', event.event);
      return NextResponse.json({ ok: true, message: 'Invoice event received' });
    }

    /** Standard bookings: fulfill on Next.js (Zoho + Resend + DB) — same pipeline as /api/payment/verify */
    if (event.event === 'charge.success' && event.data.status === 'success') {
      console.log('[paystack-webhook] charge.success — fulfillPaidBooking (Next.js)');

      const idempotencyKey = `charge.success:${paymentReference}`;
      const { data: existingEvent } = await supabase
        .from('paystack_webhook_events')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingEvent?.id) {
        console.log('[paystack-webhook] idempotent duplicate — already processed', {
          paymentReference,
        });
        return NextResponse.json({ ok: true, duplicate: true, message: 'Already processed' });
      }

      const verified = await paystackVerifyDetailed(paystackSecretKey, paymentReference);
      if (verified.outcome === 'pending') {
        console.warn('[paystack-webhook] Paystack verify still pending — will retry', {
          detail: verified.detail,
        });
        return NextResponse.json(
          { ok: false, error: 'Verify pending', detail: verified.detail },
          { status: 503 },
        );
      }
      if (verified.outcome === 'failed') {
        console.error('[paystack-webhook] Paystack verify failed after webhook', verified.reason);
        return NextResponse.json(
          { ok: false, error: verified.reason },
          { status: 400 },
        );
      }

      const booking = await fetchBookingForPaymentVerification(supabase, paymentReference);
      if (!booking) {
        console.log('[paystack-webhook] No booking for reference', paymentReference);
        return NextResponse.json({
          ok: true,
          message: 'No matching booking for this reference',
        });
      }

      const result = await fulfillPaidBooking({
        supabase,
        booking,
        reference: paymentReference,
        paystackAmountKobo: verified.amountKobo,
      });

      if (!result.ok) {
        console.error('[paystack-webhook] fulfillPaidBooking failed', result.error);
        return NextResponse.json(
          { ok: false, error: result.error ?? 'Fulfillment failed' },
          { status: 400 },
        );
      }

      const { error: logErr } = await supabase.from('paystack_webhook_events').insert({
        idempotency_key: idempotencyKey,
        paystack_reference: paymentReference,
        event_type: event.event,
      });
      if (logErr) {
        console.error('[paystack-webhook] idempotency log (non-fatal)', logErr);
      }

      return NextResponse.json({
        ok: true,
        booking_id: booking.id,
        duplicate: result.duplicate === true,
        zoho_invoice_id: result.zoho_invoice_id ?? null,
      });
    }

    const booking = await findBookingByPaystackReference(supabase, paymentReference);

    if (!booking) {
      console.log('⚠️ Booking not found for payment reference:', paymentReference);
      return NextResponse.json({
        ok: true,
        message: 'Booking not found, but webhook processed',
      });
    }

    console.log('📦 Found booking:', booking.id, 'Current status:', booking.status);

    if (event.event === 'charge.failed') {
      // Payment failed - update booking status
      console.log('❌ Payment failed, updating booking status');
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('❌ Error updating booking status:', updateError);
        return NextResponse.json(
          { ok: false, error: 'Failed to update booking' },
          { status: 500 }
        );
      }

      console.log('✅ Booking status updated to cancelled');
      return NextResponse.json({
        ok: true,
        message: 'Booking updated to cancelled',
        booking_id: booking.id,
      });
    } else if (event.event === 'refund.processed') {
      // Refund processed - update booking status
      console.log('💰 Refund processed, updating booking status');
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('❌ Error updating booking status:', updateError);
        return NextResponse.json(
          { ok: false, error: 'Failed to update booking' },
          { status: 500 }
        );
      }

      console.log('✅ Booking status updated after refund');
      return NextResponse.json({
        ok: true,
        message: 'Booking updated after refund',
        booking_id: booking.id,
      });
    }

    // Unknown event type
    console.log('ℹ️ Unhandled event type:', event.event);
    return NextResponse.json({ 
      ok: true, 
      message: 'Event received but not processed' 
    });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Webhook processing failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Paystack sends a GET request to verify the webhook endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    ok: true, 
    message: 'Paystack webhook endpoint is active' 
  });
}


