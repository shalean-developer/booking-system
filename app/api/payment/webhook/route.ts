import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import crypto from 'crypto';

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

    // Create Supabase client
    const supabase = await createClient();

    // Find booking by payment reference
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, total_amount, customer_name, customer_email')
      .eq('payment_reference', paymentReference)
      .maybeSingle();

    if (bookingError) {
      console.error('❌ Error finding booking:', bookingError);
      return NextResponse.json(
        { ok: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (!booking) {
      console.log('⚠️ Booking not found for payment reference:', paymentReference);
      // Return success to Paystack even if booking not found (prevents retries)
      return NextResponse.json({ 
        ok: true, 
        message: 'Booking not found, but webhook processed' 
      });
    }

    console.log('📦 Found booking:', booking.id, 'Current status:', booking.status);

    // Handle different event types
    if (event.event === 'charge.success') {
      // Payment successful - update booking status
      if (event.data.status === 'success') {
        console.log('✅ Payment successful, updating booking status to completed');
        
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'completed',
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

        console.log('✅ Booking status updated to completed');
        return NextResponse.json({ 
          ok: true, 
          message: 'Booking updated successfully',
          booking_id: booking.id,
        });
      }
    } else if (event.event === 'charge.failed') {
      // Payment failed - update booking status
      console.log('❌ Payment failed, updating booking status');
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
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


