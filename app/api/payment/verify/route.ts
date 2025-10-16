import { NextResponse } from 'next/server';
import type { PaystackVerificationResponse } from '@/types/booking';

/**
 * Verify Paystack payment transaction
 * Contacts Paystack API to confirm payment was successful
 */
export async function POST(req: Request) {
  console.log('=== PAYMENT VERIFICATION API CALLED ===');
  
  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    const { reference } = body;

    if (!reference) {
      console.error('No reference provided in request');
      return NextResponse.json(
        { ok: false, error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    console.log('Verifying payment reference:', reference);

    // Check if Paystack secret key is configured
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured in environment');
      return NextResponse.json(
        { ok: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    console.log('Paystack secret key found, length:', paystackSecretKey.length);

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

