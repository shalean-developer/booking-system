import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = await createCleanerSupabaseClient();

    // Check if booking exists and is assigned to this cleaner
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('cleaner_id', cleanerIdToUuid(session.id))
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { ok: false, error: 'Can only rate completed bookings' },
        { status: 400 }
      );
    }

    // Check if customer was already rated for this booking
    if (booking.customer_rating_id) {
      return NextResponse.json(
        { ok: false, error: 'Customer already rated for this booking' },
        { status: 409 }
      );
    }

    // Create customer rating
    const { data: customerRating, error: ratingError } = await supabase
      .from('customer_ratings')
      .insert({
        cleaner_id: cleanerIdToUuid(session.id),
        booking_id: bookingId,
        customer_phone: booking.customer_phone,
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (ratingError) {
      console.error('Error creating customer rating:', ratingError);
      return NextResponse.json(
        { ok: false, error: 'Failed to submit rating' },
        { status: 500 }
      );
    }

    // Update booking with rating reference
    await supabase
      .from('bookings')
      .update({ customer_rating_id: customerRating.id })
      .eq('id', bookingId);

    console.log('✅ Customer rated:', rating, 'stars for booking', bookingId);

    return NextResponse.json({
      ok: true,
      rating: customerRating,
      message: 'Customer rating submitted successfully',
    });
  } catch (error) {
    console.error('Error in rate customer route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

