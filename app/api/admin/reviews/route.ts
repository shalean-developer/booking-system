import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

/**
 * Admin Reviews API
 * GET: Fetch all reviews and customer ratings
 */
export async function GET(req: Request) {
  console.log('=== ADMIN REVIEWS GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    
    // Fetch cleaner reviews with related data
    const { data: reviews, error: reviewsError } = await supabase
      .from('cleaner_reviews')
      .select(`
        id,
        booking_id,
        customer_id,
        cleaner_id,
        overall_rating,
        quality_rating,
        punctuality_rating,
        professionalism_rating,
        review_text,
        photos,
        created_at,
        bookings!inner (
          id,
          booking_date,
          booking_time,
          service_type
        ),
        cleaners!inner (
          id,
          name,
          photo_url
        ),
        customers!inner (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching cleaner reviews:', reviewsError);
      throw reviewsError;
    }

    // Fetch customer ratings with related data
    const { data: customerRatings, error: ratingsError } = await supabase
      .from('customer_ratings')
      .select(`
        id,
        booking_id,
        cleaner_id,
        rating,
        comment,
        created_at,
        customer_phone,
        bookings!inner (
          id,
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
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('Error fetching customer ratings:', ratingsError);
      throw ratingsError;
    }

    console.log(`✅ Fetched ${reviews?.length || 0} cleaner reviews and ${customerRatings?.length || 0} customer ratings`);
    
    return NextResponse.json({
      ok: true,
      reviews: reviews || [],
      customerRatings: customerRatings || [],
    });
    
  } catch (error) {
    console.error('=== ADMIN REVIEWS GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
