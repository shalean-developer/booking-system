import { NextResponse } from 'next/server';

/**
 * Debug endpoint to test the exact booking flow
 * Simulates the payment verification and booking creation process
 */
export async function POST() {
  console.log('=== BOOKING FLOW SIMULATION ===');
  
  try {
    // Test payment verification with a fake reference
    console.log('Test 1: Payment verification...');
    const testReference = 'BK-test-' + Date.now();
    
    const verifyUrl = `https://api.paystack.co/transaction/verify/${testReference}`;
    console.log('Testing Paystack verification URL:', verifyUrl);
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Paystack verification response:', {
      status: verifyResponse.status,
      ok: verifyResponse.ok
    });
    
    const verifyData = await verifyResponse.json();
    console.log('Paystack verification data:', verifyData);
    
    // Test booking creation with minimal data
    console.log('Test 2: Booking creation...');
    const { supabase } = await import('@/lib/supabase');
    
    const testBookingData = {
      id: testReference,
      customer_id: null,
      cleaner_id: 'manual',
      booking_date: '2025-10-30',
      booking_time: '08:30',
      service_type: 'Standard',
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '0123456789',
      address_line1: 'Test Address',
      address_suburb: 'Test Suburb',
      address_city: 'Test City',
      payment_reference: testReference,
      total_amount: 390,
      cleaner_earnings: 300,
      frequency: null,
      service_fee: 40,
      frequency_discount: 0,
      price_snapshot: {
        service: { type: 'Standard', bedrooms: 2, bathrooms: 1 },
        extras: [],
        frequency: null,
        service_fee: 40,
        frequency_discount: 0,
        subtotal: 350,
        total: 390,
        snapshot_date: new Date().toISOString(),
      },
      status: 'pending',
    };
    
    console.log('Attempting to insert test booking...');
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert(testBookingData)
      .select();
    
    console.log('Booking insertion result:', { bookingData, bookingError });
    
    // Clean up test booking
    if (bookingData && bookingData.length > 0) {
      console.log('Cleaning up test booking...');
      await supabase
        .from('bookings')
        .delete()
        .eq('id', testReference);
      console.log('Test booking cleaned up');
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      tests: {
        paymentVerification: {
          status: verifyResponse.status,
          ok: verifyResponse.ok,
          data: verifyData
        },
        bookingCreation: {
          success: !bookingError,
          error: bookingError?.message,
          data: bookingData
        }
      }
    };
    
    console.log('=== BOOKING FLOW SIMULATION COMPLETE ===');
    console.log(JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('=== BOOKING FLOW SIMULATION ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
