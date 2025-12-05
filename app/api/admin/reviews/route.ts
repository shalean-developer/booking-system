import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jsonHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { 
          status: 403,
          headers: jsonHeaders
        }
      );
    }

    // Use service role client for admin operations to bypass RLS
    // We've already verified admin access above
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const rating = searchParams.get('rating') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    console.log('[Admin Reviews API] Fetching reviews with params:', { search, rating, limit, offset });

    // First, check if tables exist and have data
    try {
      const { count: cleanerCount } = await supabase
        .from('cleaner_reviews')
        .select('*', { count: 'exact', head: true });
      console.log('[Admin Reviews API] cleaner_reviews count:', cleanerCount);
    } catch (e: any) {
      console.log('[Admin Reviews API] cleaner_reviews table check:', e.code, e.message);
    }

    try {
      const { count: ratingsCount } = await supabase
        .from('customer_ratings')
        .select('*', { count: 'exact', head: true });
      console.log('[Admin Reviews API] customer_ratings count:', ratingsCount);
    } catch (e: any) {
      console.log('[Admin Reviews API] customer_ratings table check:', e.code, e.message);
    }

    // Fetch from both cleaner_reviews and customer_ratings tables
    // 1. Fetch cleaner_reviews (detailed reviews)
    let cleanerReviewsQuery = supabase
      .from('cleaner_reviews')
      .select(`
        *,
        bookings!cleaner_reviews_booking_id_fkey (
          id,
          booking_date,
          booking_time,
          service_type,
          customer_name,
          customer_email,
          customer_phone,
          customer_id,
          customers (
            id,
            first_name,
            last_name,
            email
          )
        ),
        cleaners (
          id,
          name,
          photo_url
        ),
        customers (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply rating filter for cleaner_reviews
    if (rating && rating !== 'all') {
      const ratingNum = parseInt(rating, 10);
      cleanerReviewsQuery = cleanerReviewsQuery.gte('overall_rating', ratingNum);
    }

    // Apply search filter for cleaner_reviews
    if (search) {
      cleanerReviewsQuery = cleanerReviewsQuery.ilike('review_text', `%${search}%`);
    }

    // 2. Fetch customer_ratings (simple ratings)
    // Use implicit join - Supabase will infer the relationship from booking_id -> bookings(id)
    // Also join with customers table through bookings.customer_id
    let customerRatingsQuery = supabase
      .from('customer_ratings')
      .select(`
        *,
        bookings (
          id,
          booking_date,
          booking_time,
          service_type,
          customer_name,
          customer_email,
          customer_phone,
          customer_id,
          customers (
            id,
            first_name,
            last_name,
            email
          )
        ),
        cleaners (
          id,
          name,
          photo_url
        )
      `)
      .order('created_at', { ascending: false });

    // Apply rating filter for customer_ratings
    if (rating && rating !== 'all') {
      const ratingNum = parseInt(rating, 10);
      customerRatingsQuery = customerRatingsQuery.gte('rating', ratingNum);
    }

    // Apply search filter for customer_ratings
    if (search) {
      customerRatingsQuery = customerRatingsQuery.ilike('comment', `%${search}%`);
    }

    // Execute both queries in parallel
    const [cleanerReviewsResult, customerRatingsResult] = await Promise.all([
      cleanerReviewsQuery,
      customerRatingsQuery,
    ]);

    const { data: cleanerReviewsData, error: cleanerReviewsError } = cleanerReviewsResult;
    const { data: customerRatingsData, error: customerRatingsError } = customerRatingsResult;

    // Log all errors for debugging
    if (cleanerReviewsError) {
      console.error('[Admin Reviews API] Error fetching cleaner_reviews:', {
        code: cleanerReviewsError.code,
        message: cleanerReviewsError.message,
        details: cleanerReviewsError.details,
        hint: cleanerReviewsError.hint,
      });
      
      // If it's a table not found error, that's okay - table might not exist yet
      if (cleanerReviewsError.code === '42P01') {
        console.log('[Admin Reviews API] cleaner_reviews table does not exist yet');
      } else if (cleanerReviewsError.code === '42501') {
        // RLS permission error - this is a problem
        console.error('[Admin Reviews API] RLS permission denied for cleaner_reviews - check policies');
      }
    }
    
    if (customerRatingsError) {
      console.error('[Admin Reviews API] Error fetching customer_ratings:', {
        code: customerRatingsError.code,
        message: customerRatingsError.message,
        details: customerRatingsError.details,
        hint: customerRatingsError.hint,
      });
      
      // If it's a table not found error, that's okay - table might not exist yet
      if (customerRatingsError.code === '42P01') {
        console.log('[Admin Reviews API] customer_ratings table does not exist yet');
      } else if (customerRatingsError.code === '42501') {
        // RLS permission error - this is a problem
        console.error('[Admin Reviews API] RLS permission denied for customer_ratings - check policies');
      }
    }

    // Log what we got
    console.log('[Admin Reviews API] Raw data:', {
      cleanerReviewsCount: cleanerReviewsData?.length || 0,
      customerRatingsCount: customerRatingsData?.length || 0,
      cleanerReviewsError: cleanerReviewsError?.code || null,
      customerRatingsError: customerRatingsError?.code || null,
    });

    // Debug: Log sample data structure
    if (customerRatingsData && customerRatingsData.length > 0) {
      console.log('[Admin Reviews API] Sample customer_rating structure:', {
        hasBookings: !!customerRatingsData[0].bookings,
        hasCleaners: !!customerRatingsData[0].cleaners,
        bookingData: customerRatingsData[0].bookings ? {
          customer_name: customerRatingsData[0].bookings.customer_name,
          customer_phone: customerRatingsData[0].bookings.customer_phone,
        } : null,
        cleanerData: customerRatingsData[0].cleaners ? {
          name: customerRatingsData[0].cleaners.name,
        } : null,
        directCustomerPhone: customerRatingsData[0].customer_phone,
        cleanerId: customerRatingsData[0].cleaner_id,
      });
    }

    // If customer_ratings query failed, try without explicit FK name or without joins
    let finalCustomerRatingsData = customerRatingsData;
    if (customerRatingsError) {
      console.log('[Admin Reviews API] Retrying customer_ratings with implicit join...');
      let retryQuery = supabase
        .from('customer_ratings')
        .select(`
          *,
          bookings (
            id,
            booking_date,
            booking_time,
            service_type,
            customer_name,
            customer_email,
            customer_phone
          ),
          cleaners (
            id,
            name,
            photo_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (rating && rating !== 'all') {
        const ratingNum = parseInt(rating, 10);
        retryQuery = retryQuery.gte('rating', ratingNum);
      }
      if (search) {
        retryQuery = retryQuery.ilike('comment', `%${search}%`);
      }
      
      const { data: retryData, error: retryError } = await retryQuery;
      if (!retryError) {
        finalCustomerRatingsData = retryData;
        console.log('[Admin Reviews API] Retry successful, got', retryData?.length || 0, 'ratings');
      } else {
        console.error('[Admin Reviews API] Retry with implicit join failed:', retryError);
        // Last resort: fetch without joins
        console.log('[Admin Reviews API] Trying to fetch customer_ratings without joins...');
        let simpleQuery = supabase
          .from('customer_ratings')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (rating && rating !== 'all') {
          const ratingNum = parseInt(rating, 10);
          simpleQuery = simpleQuery.gte('rating', ratingNum);
        }
        if (search) {
          simpleQuery = simpleQuery.ilike('comment', `%${search}%`);
        }
        
        const { data: simpleData, error: simpleError } = await simpleQuery;
        if (!simpleError && simpleData) {
          finalCustomerRatingsData = simpleData;
          console.log('[Admin Reviews API] Fetched', simpleData.length, 'ratings without joins');
        } else {
          console.error('[Admin Reviews API] Even simple query failed:', simpleError);
        }
      }
    }

    // Collect all cleaner_ids, customer_ids, and phone numbers that we need to fetch names for
    const cleanerIdsToFetch = new Set<string>();
    const customerIdsToFetch = new Set<string>();
    const phoneNumbersToFetch = new Set<string>();
    
    (cleanerReviewsData || []).forEach((review: any) => {
      if (review.cleaner_id && !review.cleaners?.name) {
        cleanerIdsToFetch.add(review.cleaner_id);
      }
      if (review.customer_id && !review.customers) {
        customerIdsToFetch.add(review.customer_id);
      }
      // Also collect phone numbers if we don't have customer info
      if (!review.customers && !review.customer_id) {
        const phone = review.bookings?.customer_phone;
        if (phone) {
          phoneNumbersToFetch.add(phone.replace(/\s+/g, '')); // Remove spaces for matching
        }
      }
    });
    
    (finalCustomerRatingsData || []).forEach((rating: any) => {
      if (rating.cleaner_id && !rating.cleaners?.name) {
        cleanerIdsToFetch.add(rating.cleaner_id);
      }
      // Check if booking has customer_id but no customers join
      if (rating.bookings?.customer_id && !rating.bookings?.customers) {
        customerIdsToFetch.add(rating.bookings.customer_id);
      }
      // Also collect phone numbers if we don't have customer info
      if (!rating.bookings?.customers && !rating.bookings?.customer_id) {
        const phone = rating.bookings?.customer_phone || rating.customer_phone;
        if (phone) {
          phoneNumbersToFetch.add(phone.replace(/\s+/g, '')); // Remove spaces for matching
        }
      }
    });

    // Fetch cleaner names in bulk if needed
    let cleanerNamesMap: Record<string, string> = {};
    if (cleanerIdsToFetch.size > 0) {
      console.log(`[Admin Reviews API] Fetching ${cleanerIdsToFetch.size} cleaner names separately...`);
      const { data: cleanersData } = await supabase
        .from('cleaners')
        .select('id, name')
        .in('id', Array.from(cleanerIdsToFetch));
      
      if (cleanersData) {
        cleanersData.forEach((cleaner: any) => {
          cleanerNamesMap[cleaner.id] = cleaner.name || 'Unknown';
        });
        console.log(`[Admin Reviews API] Fetched ${Object.keys(cleanerNamesMap).length} cleaner names`);
      }
    }

    // Fetch customer names in bulk if needed (by ID)
    let customerNamesMap: Record<string, string> = {};
    if (customerIdsToFetch.size > 0) {
      console.log(`[Admin Reviews API] Fetching ${customerIdsToFetch.size} customer names by ID...`);
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .in('id', Array.from(customerIdsToFetch));
      
      if (customersData) {
        customersData.forEach((customer: any) => {
          const firstName = customer.first_name || '';
          const lastName = customer.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          customerNamesMap[customer.id] = fullName || customer.email || 'Unknown';
        });
        console.log(`[Admin Reviews API] Fetched ${Object.keys(customerNamesMap).length} customer names by ID`);
      }
    }

    // Fetch customer names by phone number if needed
    let customerNamesByPhoneMap: Record<string, string> = {};
    if (phoneNumbersToFetch.size > 0) {
      console.log(`[Admin Reviews API] Fetching ${phoneNumbersToFetch.size} customer names by phone...`);
      // Fetch all customers with matching phone numbers
      // Note: We need to match phone numbers with/without spaces and formatting
      const phoneArray = Array.from(phoneNumbersToFetch);
      const { data: customersByPhoneData } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .not('phone', 'is', null);
      
      if (customersByPhoneData) {
        customersByPhoneData.forEach((customer: any) => {
          if (customer.phone) {
            // Normalize phone numbers for matching (remove spaces, dashes, etc.)
            const normalizedPhone = customer.phone.replace(/\s+/g, '').replace(/[-\s()]/g, '');
            // Check if this phone matches any of our search phones
            for (const searchPhone of phoneArray) {
              const normalizedSearchPhone = searchPhone.replace(/\s+/g, '').replace(/[-\s()]/g, '');
              if (normalizedPhone === normalizedSearchPhone || 
                  normalizedPhone.endsWith(normalizedSearchPhone) ||
                  normalizedSearchPhone.endsWith(normalizedPhone)) {
                const firstName = customer.first_name || '';
                const lastName = customer.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                customerNamesByPhoneMap[searchPhone] = fullName || customer.email || 'Unknown';
                break;
              }
            }
          }
        });
        console.log(`[Admin Reviews API] Fetched ${Object.keys(customerNamesByPhoneMap).length} customer names by phone`);
      }
    }

    // Transform cleaner_reviews data
    const cleanerReviews = (cleanerReviewsData || []).map((review: any) => {
      // Try multiple sources for customer name (similar to cleaner names)
      let customerName = 'Unknown';
      
      // First try: customers table join (direct)
      if (review.customers) {
        const firstName = review.customers.first_name || '';
        const lastName = review.customers.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        customerName = fullName || review.customers.email || 'Unknown';
      }
      // Second try: customers table join through bookings
      else if (review.bookings?.customers) {
        const firstName = review.bookings.customers.first_name || '';
        const lastName = review.bookings.customers.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        customerName = fullName || review.bookings.customers.email || 'Unknown';
      }
      // Third try: customerNamesMap (fetched by ID separately)
      else if (review.customer_id && customerNamesMap[review.customer_id]) {
        customerName = customerNamesMap[review.customer_id];
      }
      else if (review.bookings?.customer_id && customerNamesMap[review.bookings.customer_id]) {
        customerName = customerNamesMap[review.bookings.customer_id];
      }
      // Fourth try: customerNamesByPhoneMap (fetched by phone separately)
      else {
        const phone = review.bookings?.customer_phone;
        if (phone) {
          const normalizedPhone = phone.replace(/\s+/g, '');
          if (customerNamesByPhoneMap[normalizedPhone]) {
            customerName = customerNamesByPhoneMap[normalizedPhone];
          }
        }
      }
      // Fifth try: bookings.customer_name (direct field)
      if (customerName === 'Unknown' && review.bookings?.customer_name) {
        customerName = review.bookings.customer_name;
      }
      // Sixth try: customer_phone as fallback (only if we still don't have a name)
      if (customerName === 'Unknown' && review.bookings?.customer_phone) {
        customerName = `Customer (${review.bookings.customer_phone})`;
      }
      // Last resort: email
      if (customerName === 'Unknown' && review.bookings?.customer_email) {
        customerName = review.bookings.customer_email;
      }

      // Try multiple sources for cleaner name
      let cleanerName = 'Unknown';
      if (review.cleaners?.name) {
        cleanerName = review.cleaners.name;
      } else if (review.cleaner_id && cleanerNamesMap[review.cleaner_id]) {
        cleanerName = cleanerNamesMap[review.cleaner_id];
      } else if (review.cleaner_id) {
        cleanerName = `Cleaner (${review.cleaner_id.substring(0, 8)}...)`;
      }

      return {
        id: review.id,
        booking_id: review.booking_id,
        customer_name: customerName,
        cleaner_name: cleanerName,
        rating: review.overall_rating,
        comment: review.review_text || null,
        is_approved: true,
        created_at: review.created_at,
        review_type: 'detailed' as const,
        // Additional fields for detailed view
        overall_rating: review.overall_rating,
        quality_rating: review.quality_rating,
        punctuality_rating: review.punctuality_rating,
        professionalism_rating: review.professionalism_rating,
        review_text: review.review_text,
        photos: review.photos,
        booking_date: review.bookings?.booking_date,
        booking_time: review.bookings?.booking_time,
        service_type: review.bookings?.service_type,
      };
    });

    // Transform customer_ratings data
    const customerRatings = (finalCustomerRatingsData || []).map((rating: any) => {
      // Try multiple sources for customer name (similar to cleaner names)
      let customerName = 'Unknown';
      
      // First try: customers table join through bookings
      if (rating.bookings?.customers) {
        const firstName = rating.bookings.customers.first_name || '';
        const lastName = rating.bookings.customers.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        customerName = fullName || rating.bookings.customers.email || 'Unknown';
      }
      // Second try: customerNamesMap (fetched by ID separately)
      else if (rating.bookings?.customer_id && customerNamesMap[rating.bookings.customer_id]) {
        customerName = customerNamesMap[rating.bookings.customer_id];
      }
      // Third try: customerNamesByPhoneMap (fetched by phone separately)
      else {
        const phone = rating.bookings?.customer_phone || rating.customer_phone;
        if (phone) {
          const normalizedPhone = phone.replace(/\s+/g, '');
          if (customerNamesByPhoneMap[normalizedPhone]) {
            customerName = customerNamesByPhoneMap[normalizedPhone];
          }
        }
      }
      // Fourth try: bookings.customer_name (direct field)
      if (customerName === 'Unknown' && rating.bookings?.customer_name) {
        customerName = rating.bookings.customer_name;
      }
      // Fifth try: customer_phone as fallback (only if we still don't have a name)
      if (customerName === 'Unknown') {
        const phone = rating.bookings?.customer_phone || rating.customer_phone;
        if (phone) {
          customerName = `Customer (${phone})`;
        }
      }
      // Last resort: email
      if (customerName === 'Unknown' && rating.bookings?.customer_email) {
        customerName = rating.bookings.customer_email;
      }

      // Try multiple sources for cleaner name
      let cleanerName = 'Unknown';
      if (rating.cleaners?.name) {
        cleanerName = rating.cleaners.name;
      } else if (rating.cleaner_id && cleanerNamesMap[rating.cleaner_id]) {
        cleanerName = cleanerNamesMap[rating.cleaner_id];
      } else if (rating.cleaner_id) {
        cleanerName = `Cleaner (${rating.cleaner_id.substring(0, 8)}...)`;
      }

      return {
        id: rating.id,
        booking_id: rating.booking_id,
        customer_name: customerName,
        cleaner_name: cleanerName,
        rating: rating.rating,
        comment: rating.comment || null,
        is_approved: true,
        created_at: rating.created_at,
        review_type: 'simple' as const,
        // Map to same structure
        overall_rating: rating.rating,
        quality_rating: null,
        punctuality_rating: null,
        professionalism_rating: null,
        review_text: rating.comment,
        photos: [],
        booking_date: rating.bookings?.booking_date,
        booking_time: rating.bookings?.booking_time,
        service_type: rating.bookings?.service_type,
      };
    });

    // Combine both types of reviews and sort by created_at
    let allReviews = [...cleanerReviews, ...customerRatings].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Apply search filter in memory if needed (for cross-table search)
    if (search) {
      const searchLower = search.toLowerCase();
      allReviews = allReviews.filter((review: any) => 
        review.comment?.toLowerCase().includes(searchLower) ||
        review.customer_name?.toLowerCase().includes(searchLower) ||
        review.cleaner_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const paginatedReviews = allReviews.slice(offset, offset + limit);

    const totalReviews = allReviews.length;
    const totalPages = Math.ceil(totalReviews / limit);

    console.log(`[Admin Reviews API] Successfully fetched ${cleanerReviews.length} cleaner_reviews and ${customerRatings.length} customer_ratings (${totalReviews} total)`);

    return NextResponse.json(
      {
        ok: true,
        reviews: paginatedReviews,
        total: totalReviews,
        totalPages,
      },
      {
        headers: jsonHeaders
      }
    );
  } catch (error: any) {
    console.error('Error in admin reviews API:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { 
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}

