import { NextResponse } from 'next/server';
import { createClient, getServerAuthUser } from '@/lib/supabase-server';

/**
 * API endpoint to fetch bookings for authenticated user's dashboard
 * Requires authentication
 */
export async function GET(request: Request) {
  console.log('=== DASHBOARD BOOKINGS API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      console.log('❌ Invalid token');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('✅ Authenticated user:', authUser.email);

    // Find customer profile by auth_user_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, total_bookings')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Failed to fetch customer profile',
          details: customerError.message,
        },
        { status: 500 }
      );
    }

    if (!customer) {
      console.log('ℹ️ No customer profile found for auth user');
      // User has signed up but hasn't made any bookings yet
      return NextResponse.json({
        ok: true,
        bookings: [],
        customer: null,
        message: 'No bookings yet',
      });
    }

    console.log('✅ Customer profile found:', customer.id);

    // Get limit from query params (default: 10)
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Fetch bookings for this customer (with graceful fallback if `notes` column doesn't exist)
    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        notes,
        status,
        total_amount,
        created_at,
        address_line1,
        address_suburb,
        address_city,
        cleaner_id,
        customer_name,
        customer_email,
        customer_phone,
        payment_reference,
        customer_reviewed,
        customer_review_id
      `)
      .eq('customer_id', customer.id)
      .order('booking_date', { ascending: false })
      .limit(limit);

    let { data: bookings, error: bookingsError } = await bookingsQuery;

    // If the error indicates unknown column `notes`, retry without it
    if (bookingsError && (bookingsError.message?.includes('notes') || bookingsError.details?.includes('notes'))) {
      console.warn('Column `notes` not found on bookings; retrying without it');
      const retry = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          service_type,
          status,
          total_amount,
          created_at,
          address_line1,
          address_suburb,
          address_city,
          cleaner_id,
          customer_name,
          customer_email,
          customer_phone,
          payment_reference,
          customer_reviewed,
          customer_review_id
        `)
        .eq('customer_id', customer.id)
        .order('booking_date', { ascending: false })
        .limit(limit);
      // Ensure shape matches earlier select by adding notes: null for each row
      bookings = (retry.data || []).map((b: any) => ({ ...b, notes: null }));
      bookingsError = retry.error || null;
    }

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to fetch bookings',
          details: bookingsError.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${bookings?.length || 0} bookings`);

    return NextResponse.json({
      ok: true,
      bookings: bookings || [],
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        totalBookings: customer.total_bookings,
      },
    });

  } catch (error) {
    console.error('=== DASHBOARD BOOKINGS ERROR ===');
    console.error(error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

