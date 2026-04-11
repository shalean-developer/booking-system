import { NextResponse } from 'next/server';
import type { PaystackVerificationResponse } from '@/types/booking';
import { validatePaymentEnv } from '@/lib/env-validation';
import { createServiceClient } from '@/lib/supabase-server';
import {
  finalizePaidBookingServer,
  paystackVerifyTransaction,
  resolveBookingForVerify,
} from '@/lib/booking-paid-server';

export const dynamic = 'force-dynamic';

/**
 * Client-friendly verify after Paystack redirect: ?reference=booking-{uuid}&trxref=…&ref=…
 * Verifies with Paystack, updates booking, Zoho invoice + Resend (no Edge Function required).
 */
export async function GET(req: Request) {
  try {
    console.log('🔥 VERIFY ROUTE HIT');

    const { searchParams } = new URL(req.url);
    const referenceParam =
      searchParams.get('reference')?.trim() ||
      searchParams.get('trxref')?.trim() ||
      searchParams.get('ref')?.trim() ||
      '';
    if (!referenceParam) {
      return NextResponse.json(
        { ok: false, success: false, error: 'reference is required' },
        { status: 400 },
      );
    }

    let bookingIdHint =
      searchParams.get('booking_id')?.trim() ||
      searchParams.get('id')?.trim() ||
      '';
    if (!bookingIdHint) {
      const refOnly = searchParams.get('ref')?.trim();
      if (
        refOnly &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refOnly)
      ) {
        bookingIdHint = refOnly;
      }
    }
    if (!bookingIdHint && referenceParam.startsWith('booking-')) {
      bookingIdHint = referenceParam.slice('booking-'.length);
    }

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json(
        { ok: false, success: false, error: 'Payment provider not configured' },
        { status: 500 },
      );
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error:
            'SUPABASE_SERVICE_ROLE_KEY is required for payment verification. Add it to .env.local.',
        },
        { status: 503 },
      );
    }

    const { booking, error: resolveErr } = await resolveBookingForVerify(
      supabase,
      referenceParam,
      bookingIdHint || null,
    );
    if (resolveErr) {
      return NextResponse.json({ ok: false, success: false, error: resolveErr }, { status: 400 });
    }
    if (!booking) {
      return NextResponse.json({ ok: false, success: false, error: 'Booking not found' }, { status: 404 });
    }

    console.log('📦 Booking:', booking.id);

    const verified = await paystackVerifyTransaction(secret, referenceParam);
    if (!verified.ok) {
      return NextResponse.json(
        { ok: false, success: false, error: 'Payment verification failed' },
        { status: 400 },
      );
    }

    console.log('🧾 Creating invoice...');
    const result = await finalizePaidBookingServer({
      supabase,
      booking,
      reference: referenceParam,
      paystackAmountKobo: verified.amountKobo,
    });
    console.log('✅ Invoice / finalize step done');

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, success: false, error: result.error ?? 'Finalize failed' },
        { status: 400 },
      );
    }

    console.log('[api/payment/verify GET] finalize ok — email path runs in finalizePaidBookingServer', booking.id);

    const duplicate = result.duplicate === true;
    const amount_zar = Math.round(Number(booking.total_amount ?? 0)) / 100;

    return NextResponse.json({
      ok: true,
      success: true,
      duplicate,
      booking_id: booking.id,
      zoho_invoice_id: result.zoho_invoice_id ?? null,
      amount_zar,
      service_type: booking.service_type,
      customer_name: booking.customer_name,
    });
  } catch (e) {
    console.error('[api/payment/verify GET]', e);
    return NextResponse.json(
      { ok: false, success: false, error: e instanceof Error ? e.message : 'Verification failed' },
      { status: 500 },
    );
  }
}

/**
 * Verify Paystack payment transaction
 * Contacts Paystack API to confirm payment was successful
 */
export async function POST(req: Request) {
  console.log('=== PAYMENT VERIFICATION API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Validate environment configuration
    console.log('Step 1: Validating payment environment...');
    const envValidation = validatePaymentEnv();
    if (!envValidation.valid) {
      console.error('❌ Payment environment validation failed:', envValidation.missing);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Payment service not configured',
          details: envValidation.errors,
        },
        { status: 500 }
      );
    }
    console.log('✅ Payment environment validation passed');

    // Parse request body
    console.log('Step 2: Parsing request body...');
    const body = await req.json();
    console.log('Request body:', body);
    
    const { reference } = body;

    if (!reference) {
      console.error('❌ No reference provided in request');
      return NextResponse.json(
        { ok: false, error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    console.log('✅ Payment reference found:', reference);

    // Verify with Paystack
    console.log('Step 3: Verifying payment with Paystack...');
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY!;
    console.log('Paystack secret key configured, length:', paystackSecretKey.length);

    // Verify payment with Paystack API
    const verificationUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    console.log('Calling Paystack API:', verificationUrl);
    
    const response = await fetch(verificationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Paystack API response status:', response.status);
    console.log('Paystack API response ok:', response.ok);

    const data = await response.json();
    console.log('Paystack API response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Paystack API returned error:', data);
      return NextResponse.json(
        { 
          ok: false, 
          error: data.message || 'Payment verification failed',
          message: 'Unable to verify payment'
        },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (data.status && data.data && data.data.status === 'success') {
      console.log('✅ Payment verified successfully:', reference);
      console.log('Amount:', data.data.amount / 100, 'ZAR');
      console.log('Customer:', data.data.customer.email);
      
      const result: PaystackVerificationResponse = {
        ok: true,
        data: {
          status: data.data.status,
          reference: data.data.reference,
          amount: data.data.amount / 100, // Convert from kobo to rands
          currency: data.data.currency,
          paid_at: data.data.paid_at,
          customer: {
            email: data.data.customer.email,
          },
        },
        message: 'Payment verified successfully',
      };

      console.log('Returning success response:', result);
      return NextResponse.json(result);
    } else {
      console.error('❌ Payment not successful');
      console.error('Response status:', data.status);
      console.error('Payment data:', data.data);
      console.error('Payment status:', data.data?.status);
      
      // Enhanced error logging for debugging
      const errorDetails = {
        reference,
        paystackResponse: data,
        possibleCauses: [
          'Payment was not completed',
          'Payment failed',
          'Reference does not exist',
          'Timing issue - payment still processing'
        ]
      };
      
      console.error('Payment verification error details:', errorDetails);
      
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Payment was not successful',
          message: data.data?.gateway_response || data.message || 'Payment verification failed',
          details: errorDetails
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('=== PAYMENT VERIFICATION ERROR ===');
    console.error('Error type:', error instanceof Error ? 'Error' : typeof error);
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to verify payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

