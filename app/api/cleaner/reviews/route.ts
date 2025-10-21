import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('=== CLEANER REVIEWS API CALLED ===');
  
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Cleaner authenticated:', session.id, session.name);

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

    // Fetch last 10 reviews for this cleaner
    const { data: reviews, error: reviewsError } = await supabase
      .from('cleaner_reviews')
      .select('id, booking_id, customer_id, overall_rating, quality_rating, punctuality_rating, professionalism_rating, review_text, photos, created_at')
      .eq('cleaner_id', session.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      console.error('Cleaner ID used:', session.id);
      console.error('Cleaner ID type:', typeof session.id);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch reviews', details: reviewsError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${reviews?.length || 0} reviews for cleaner ${session.name}`);

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        ok: true,
        reviews: [],
      });
    }

    // Fetch related bookings
    const bookingIds = reviews.map(r => r.booking_id);
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, service_type, address_line1, address_suburb, address_city')
      .in('id', bookingIds);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    // Fetch related customers
    const customerIds = reviews.map(r => r.customer_id);
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email')
      .in('id', customerIds);

    if (customersError) {
      console.error('Error fetching customers:', customersError);
    }

    // Create lookup maps
    const bookingsMap = new Map(bookings?.map(b => [b.id, b]) || []);
    const customersMap = new Map(customers?.map(c => [c.id, c]) || []);

    // Transform the data to match our interface
    const transformedReviews = reviews.map((review: any) => ({
      id: review.id,
      booking_id: review.booking_id,
      overall_rating: review.overall_rating,
      quality_rating: review.quality_rating,
      punctuality_rating: review.punctuality_rating,
      professionalism_rating: review.professionalism_rating,
      review_text: review.review_text,
      photos: review.photos || [],
      created_at: review.created_at,
      bookings: bookingsMap.get(review.booking_id) || null,
      customers: customersMap.get(review.customer_id) || null,
    }));

    return NextResponse.json({
      ok: true,
      reviews: transformedReviews,
    });

  } catch (error) {
    console.error('=== CLEANER REVIEWS ERROR ===');
    console.error(error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred while fetching reviews' },
      { status: 500 }
    );
  }
}
