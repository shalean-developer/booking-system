import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('id');
    const authHeader = request.headers.get('Authorization');
    
    console.log('=== DASHBOARD BOOKING API CALLED ===');
    console.log('Booking ID:', bookingId);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!bookingId) {
      console.log('❌ No booking ID provided');
      return NextResponse.json({ ok: false, error: 'Missing booking id' }, { status: 400 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      console.log('❌ Auth error:', authError?.message);
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Authenticated user:', authUser.email);

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    
    if (customerError) {
      console.error('❌ Customer fetch error:', customerError);
      return NextResponse.json({ ok: false, error: 'Customer lookup failed' }, { status: 500 });
    }
    
    if (!customer) {
      console.log('❌ Customer not found');
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    console.log('✅ Customer found:', customer.id);

    // First check if booking exists at all (without customer filter for debugging)
    const { data: bookingCheck, error: checkError } = await supabase
      .from('bookings')
      .select('id, customer_id')
      .eq('id', bookingId)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Booking check error:', checkError);
      return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
    }
    
    if (!bookingCheck) {
      console.log('❌ Booking not found in database:', bookingId);
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }
    
    console.log('✅ Booking exists, customer_id:', bookingCheck.customer_id, 'Expected:', customer.id);
    
    if (bookingCheck.customer_id !== customer.id) {
      console.log('❌ Booking does not belong to customer');
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    // Now fetch full booking details
    // Try with all columns first, fallback if some columns don't exist
    let bookingQuery = supabase
      .from('bookings')
      .select('id, service_type, bedrooms, bathrooms, extras, notes, customer_name, customer_email, customer_phone, address_line1, address_suburb, address_city, total_amount, booking_date, booking_time, status, payment_reference, cleaner_id, cleaner_claimed_at, cleaner_accepted_at, cleaner_on_my_way_at, cleaner_started_at, cleaner_completed_at, created_at, updated_at, frequency, service_fee, frequency_discount, tip_amount, cleaner_earnings')
      .eq('id', bookingId)
      .eq('customer_id', customer.id)
      .maybeSingle();
    
    let { data: booking, error } = await bookingQuery;
    
    // If the error indicates unknown column, retry without problematic columns
    if (error && (error.message?.includes('notes') || error.details?.includes('notes') || error.message?.includes('bedrooms') || error.message?.includes('bathrooms') || error.message?.includes('extras'))) {
      console.warn('⚠️ Some columns not found, retrying with basic columns:', error.message);
      const retryQuery = supabase
        .from('bookings')
        .select('id, service_type, customer_name, customer_email, customer_phone, address_line1, address_suburb, address_city, total_amount, booking_date, booking_time, status, payment_reference, cleaner_id, created_at, updated_at')
        .eq('id', bookingId)
        .eq('customer_id', customer.id)
        .maybeSingle();
      
      const retryResult = await retryQuery;
      error = retryResult.error;
      
      // Add default values for missing columns
      if (retryResult.data) {
        booking = {
          ...retryResult.data,
          bedrooms: null,
          bathrooms: null,
          extras: null,
          notes: null,
          cleaner_claimed_at: null,
          cleaner_accepted_at: null,
          cleaner_on_my_way_at: null,
          cleaner_started_at: null,
          cleaner_completed_at: null,
          frequency: null,
          service_fee: null,
          frequency_discount: null,
          tip_amount: null,
          cleaner_earnings: null,
        } as any;
      } else {
        booking = null;
      }
    }
    
    if (error) {
      console.error('❌ Booking fetch error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to fetch booking details',
        details: error.message 
      }, { status: 500 });
    }
    
    if (!booking) {
      console.log('❌ Booking not found after customer check');
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    console.log('✅ Booking found:', booking.id, 'Service:', booking.service_type);

    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('id');
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'Missing booking id' }, { status: 400 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    
    if (customerError || !customer) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    // Verify booking belongs to customer
    const { data: bookingCheck } = await supabase
      .from('bookings')
      .select('id, customer_id')
      .eq('id', bookingId)
      .eq('customer_id', customer.id)
      .maybeSingle();
    
    if (!bookingCheck) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};
    
    if (body.payment_reference !== undefined) {
      updateData.payment_reference = body.payment_reference;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .eq('customer_id', customer.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ ok: false, error: 'Failed to update booking' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

