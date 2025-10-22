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
      console.log('❌ No authenticated user found');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('✅ Authenticated user:', authUser.email);

    const supabase = await createClient();

    // Get customer profile
    let { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
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
        .select('id')
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
      console.error('❌ Error fetching reviews:', reviewsError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch reviews', details: reviewsError.message },
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
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred while fetching reviews', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

