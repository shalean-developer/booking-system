import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient, getServerAuthUser } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== CUSTOMER REVIEW API CALLED ===');
  
  try {
    // Get authenticated user
    const authUser = await getServerAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const body = await request.json();

    // Validate required fields
    const {
      overallRating,
      qualityRating,
      punctualityRating,
      professionalismRating,
      reviewText,
      photos,
    } = body;

    if (
      !overallRating ||
      !qualityRating ||
      !punctualityRating ||
      !professionalismRating
    ) {
      return NextResponse.json(
        { ok: false, error: 'All rating criteria are required' },
        { status: 400 }
      );
    }

    // Validate ratings are in valid range
    const ratings = [overallRating, qualityRating, punctualityRating, professionalismRating];
    if (ratings.some(r => r < 1 || r > 5)) {
      return NextResponse.json(
        { ok: false, error: 'Ratings must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient(); // Use service role to bypass RLS

    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ Customer found:', customer.id);

    // Get booking and verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, cleaner_id, status, customer_reviewed')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify customer owns this booking
    if (booking.customer_id !== customer.id) {
      return NextResponse.json(
        { ok: false, error: 'You do not have permission to review this booking' },
        { status: 403 }
      );
    }

    // Verify booking is completed
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { ok: false, error: 'Can only review completed bookings' },
        { status: 400 }
      );
    }

    // Verify no cleaner assigned (can't review if no cleaner)
    if (!booking.cleaner_id || booking.cleaner_id === 'manual') {
      return NextResponse.json(
        { ok: false, error: 'Cannot review booking without an assigned cleaner' },
        { status: 400 }
      );
    }

    // Check if already reviewed
    if (booking.customer_reviewed) {
      return NextResponse.json(
        { ok: false, error: 'You have already reviewed this booking' },
        { status: 400 }
      );
    }

    console.log('✅ Booking validated, creating review...');

    // Convert cleaner_id from TEXT to UUID
    let cleanerUuid: string;
    try {
      cleanerUuid = booking.cleaner_id; // Already validated it's not 'manual'
      // Validate it's a proper UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanerUuid)) {
        throw new Error('Invalid UUID format');
      }
    } catch (e) {
      console.error('Invalid cleaner UUID:', booking.cleaner_id);
      return NextResponse.json(
        { ok: false, error: 'Invalid cleaner assignment' },
        { status: 400 }
      );
    }

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('cleaner_reviews')
      .insert({
        booking_id: bookingId,
        cleaner_id: cleanerUuid, // Use validated UUID
        customer_id: customer.id,
        overall_rating: overallRating,
        quality_rating: qualityRating,
        punctuality_rating: punctualityRating,
        professionalism_rating: professionalismRating,
        review_text: reviewText || null,
        photos: photos || [],
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return NextResponse.json(
        { ok: false, error: 'Failed to create review', details: reviewError.message },
        { status: 500 }
      );
    }

    console.log('✅ Review created:', review.id);

    // Update booking to mark as reviewed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        customer_reviewed: true,
        customer_review_id: review.id,
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      // Review is created, so don't fail completely
    }

    console.log('✅ Booking marked as reviewed');

    return NextResponse.json({
      ok: true,
      review: review,
      message: 'Review submitted successfully',
    });

  } catch (error) {
    console.error('=== REVIEW SUBMISSION ERROR ===');
    console.error(error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred while submitting the review' },
      { status: 500 }
    );
  }
}

