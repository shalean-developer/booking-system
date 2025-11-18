import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';

/**
 * GET /api/cleaner/reviews
 * Fetch all reviews for the authenticated cleaner
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createCleanerSupabaseClient();
    const cleanerId = cleanerIdToUuid(session.id);

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');

    // Build query
    let query = supabase
      .from('cleaner_reviews')
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
        customers:customer_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('cleaner_id', cleanerId)
      .order('created_at', { ascending: false });

    // Filter by booking if provided
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reviews: reviews || [],
    });
  } catch (error) {
    console.error('Error in GET /api/cleaner/reviews:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
