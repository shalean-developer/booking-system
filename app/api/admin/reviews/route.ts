import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Reviews API - SIMPLIFIED VERSION
 * GET: Fetch all reviews and customer ratings
 */
export async function GET(req: Request) {
  console.log('=== ADMIN REVIEWS GET (SIMPLIFIED) ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      console.log('❌ Admin check failed');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('✅ Admin access confirmed');
    const supabase = await createClient();
    
    // Fetch cleaner reviews with customer and cleaner names
    console.log('🔍 Fetching cleaner reviews...');
    const { data: reviews, error: reviewsError } = await supabase
      .from('cleaner_reviews')
      .select(`
        *,
        customers!cleaner_reviews_customer_id_fkey (
          first_name,
          last_name,
          email
        ),
        cleaners!cleaner_reviews_cleaner_id_fkey (
          name,
          photo_url
        )
      `)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('❌ Error fetching cleaner reviews:', reviewsError);
      return NextResponse.json(
        { ok: false, error: 'Database error fetching reviews', details: reviewsError.message },
        { status: 500 }
      );
    }

    console.log(`📊 Cleaner reviews fetched: ${reviews?.length || 0}`);

    // Fetch customer ratings with cleaner names
    console.log('🔍 Fetching customer ratings...');
    const { data: customerRatings, error: ratingsError } = await supabase
      .from('customer_ratings')
      .select(`
        *,
        cleaners!customer_ratings_cleaner_id_fkey (
          name,
          photo_url
        )
      `)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('❌ Error fetching customer ratings:', ratingsError);
      return NextResponse.json(
        { ok: false, error: 'Database error fetching ratings', details: ratingsError.message },
        { status: 500 }
      );
    }

    console.log(`📊 Customer ratings fetched: ${customerRatings?.length || 0}`);
    console.log(`✅ Successfully fetched ${reviews?.length || 0} reviews and ${customerRatings?.length || 0} ratings`);
    
    return NextResponse.json({
      ok: true,
      reviews: reviews || [],
      customerRatings: customerRatings || [],
    });
    
  } catch (error) {
    console.error('=== ADMIN REVIEWS GET ERROR ===', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to fetch reviews',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
