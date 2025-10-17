import { NextResponse } from 'next/server';
import type { PaystackVerificationResponse } from '@/types/booking';
import { validatePaymentEnv } from '@/lib/env-validation';

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
    if (data.status && data.data.status === 'success') {
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
      console.error('❌ Payment not successful, status:', data.data.status);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Payment was not successful',
          message: data.data.gateway_response || 'Payment failed'
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

