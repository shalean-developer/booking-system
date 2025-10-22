import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('=== CUSTOMER RATINGS API CALLED ===');
  
  try {
    // Get authenticated user
    const authUser = await getServerAuthUser();
    
    if (!authUser) {
      console.log('❌ No authenticated user found');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('✅ Authenticated user:', authUser.email);

    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
      return NextResponse.json(
        { ok: false, error: 'Server configuration error - service key missing' },
        { status: 500 }
      );
    }

    // Create service client that bypasses RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('✅ Service client created successfully');

    // Get customer profile
    let { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, phone')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return NextResponse.json(
        { ok: false, error: 'Database error while fetching customer profile', details: customerError.message },
        { status: 500 }
      );
    }

    if (!customer) {
      console.log('ℹ️ No customer profile found for user:', authUser.id);
      console.log('📝 Creating customer profile automatically...');
      
      // Create a basic customer profile for the authenticated user
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          email: authUser.email!,
          phone: null, // Will be filled when they make their first booking
          first_name: authUser.user_metadata?.first_name || null,
          last_name: authUser.user_metadata?.last_name || null,
          address_line1: null,
          address_suburb: null,
          address_city: null,
          auth_user_id: authUser.id,
          total_bookings: 0,
        })
        .select('id, phone')
        .single();

      if (createError) {
        console.error('❌ Failed to create customer profile:', createError);
        return NextResponse.json(
          { ok: false, error: 'Failed to create customer profile', details: createError.message },
          { status: 500 }
        );
      }

      console.log('✅ Customer profile created:', newCustomer.id);
      customer = newCustomer;
    }

    console.log('✅ Customer found:', customer.id, 'Phone:', customer.phone);

    // If customer has no phone number, they can't have ratings yet
    if (!customer.phone) {
      console.log('ℹ️ Customer has no phone number - no ratings possible yet');
      return NextResponse.json({
        ok: true,
        ratings: [],
      });
    }

    // Fetch all ratings for this customer
    const { data: ratings, error: ratingsError } = await supabase
      .from('customer_ratings')
      .select('id, rating, created_at, booking_id, cleaner_id')
      .eq('customer_phone', customer.phone)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('❌ Error fetching ratings:', ratingsError);
      console.error('Customer phone used:', customer.phone);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch ratings', details: ratingsError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${ratings?.length || 0} ratings for customer`);

    if (!ratings || ratings.length === 0) {
      return NextResponse.json({
        ok: true,
        ratings: [],
      });
    }

    // Fetch related bookings
    const bookingIds = ratings.map(r => r.booking_id);
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, service_type, address_line1, address_suburb, address_city')
      .in('id', bookingIds);

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch booking details', details: bookingsError.message },
        { status: 500 }
      );
    }

    // Fetch related cleaners
    const cleanerIds = ratings.map(r => r.cleaner_id);
    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('id, name, photo_url')
      .in('id', cleanerIds);

    if (cleanersError) {
      console.error('❌ Error fetching cleaners:', cleanersError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch cleaner details', details: cleanersError.message },
        { status: 500 }
      );
    }

    // Create lookup maps
    const bookingsMap = new Map(bookings?.map(b => [b.id, b]) || []);
    const cleanersMap = new Map(cleaners?.map(c => [c.id, c]) || []);

    // Transform the data to match our interface
    const transformedRatings = ratings.map((rating: any) => ({
      id: rating.id,
      rating: rating.rating,
      created_at: rating.created_at,
      bookings: bookingsMap.get(rating.booking_id) || null,
      cleaners: cleanersMap.get(rating.cleaner_id) || null,
    }));

    console.log('✅ Successfully processed ratings data');

    return NextResponse.json({
      ok: true,
      ratings: transformedRatings,
    });

  } catch (error) {
    console.error('=== CUSTOMER RATINGS ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred while fetching ratings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
