import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('=== CUSTOMER RATINGS API CALLED ===');
  
  try {
    // Get authenticated user
    const authUser = await getServerAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Create service client that bypasses RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, phone')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ Customer found:', customer.id, 'Phone:', customer.phone);

    // Fetch all ratings for this customer
    const { data: ratings, error: ratingsError } = await supabase
      .from('customer_ratings')
      .select('id, rating, created_at, booking_id, cleaner_id')
      .eq('customer_phone', customer.phone)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
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
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, service_type, address_line1, address_suburb, address_city')
      .in('id', bookingIds);

    // Fetch related cleaners
    const cleanerIds = ratings.map(r => r.cleaner_id);
    const { data: cleaners } = await supabase
      .from('cleaners')
      .select('id, name, photo_url')
      .in('id', cleanerIds);

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

    return NextResponse.json({
      ok: true,
      ratings: transformedRatings,
    });

  } catch (error) {
    console.error('=== CUSTOMER RATINGS ERROR ===');
    console.error(error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred while fetching ratings' },
      { status: 500 }
    );
  }
}
