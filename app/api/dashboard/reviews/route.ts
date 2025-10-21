import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServerAuthUser } from '@/lib/supabase-server';

/**
 * API endpoint to fetch customer's reviews
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  console.log('=== DASHBOARD REVIEWS API CALLED ===');
  
  try {
    // Get authenticated user
    const authUser = await getServerAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('✅ Authenticated user:', authUser.email);

    const supabase = await createClient();

    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch customer profile' },
        { status: 500 }
      );
    }

    if (!customer) {
      console.log('ℹ️ No customer profile found');
      return NextResponse.json({
        ok: true,
        reviews: [],
        message: 'No reviews yet',
      });
    }

    console.log('✅ Customer found:', customer.id);

    // Fetch all reviews by this customer with booking and cleaner details
    const { data: reviews, error: reviewsError } = await supabase
      .from('cleaner_reviews')
      .select(`
        id,
        booking_id,
        cleaner_id,
        overall_rating,
        quality_rating,
        punctuality_rating,
        professionalism_rating,
        review_text,
        photos,
        created_at,
        bookings!inner (
          booking_date,
          booking_time,
          service_type,
          address_line1,
          address_suburb,
          address_city
        ),
        cleaners!inner (
          id,
          name,
          photo_url
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${reviews?.length || 0} reviews`);

    return NextResponse.json({
      ok: true,
      reviews: reviews || [],
    });

  } catch (error) {
    console.error('=== DASHBOARD REVIEWS ERROR ===');
    console.error(error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred while fetching reviews' },
      { status: 500 }
    );
  }
}

