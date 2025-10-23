import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Reviews API - FIXED VERSION
 * GET: Fetch all reviews and customer ratings
 */
export async function GET(req: Request) {
  console.log('=== ADMIN REVIEWS GET (FIXED VERSION) ===');
  
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
    // Using simple query first, then fetch related data separately to avoid RLS issues
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
        created_at
      `)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('❌ Error fetching cleaner reviews:', reviewsError);
      throw reviewsError;
    }

    console.log(`📊 Cleaner reviews fetched: ${reviews?.length || 0}`);
    if (reviews && reviews.length > 0) {
      console.log('Sample review:', JSON.stringify(reviews[0], null, 2));
    }

    // Fetch customer ratings with related data
    // Using simple query first to avoid RLS issues with joins
    const { data: customerRatings, error: ratingsError } = await supabase
      .from('customer_ratings')
      .select(`
        id,
        booking_id,
        cleaner_id,
        rating,
        comment,
        created_at,
        customer_phone
      `)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('❌ Error fetching customer ratings:', ratingsError);
      throw ratingsError;
    }

    console.log(`📊 Customer ratings fetched: ${customerRatings?.length || 0}`);
    if (customerRatings && customerRatings.length > 0) {
      console.log('Sample rating:', JSON.stringify(customerRatings[0], null, 2));
    }

    console.log(`✅ Successfully fetched ${reviews?.length || 0} cleaner reviews and ${customerRatings?.length || 0} customer ratings`);
    
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
