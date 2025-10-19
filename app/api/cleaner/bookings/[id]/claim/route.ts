import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient } from '@/lib/cleaner-auth';

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
    const supabase = await createCleanerSupabaseClient();

    // Check if booking exists and is available
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is still available
    if (booking.cleaner_id) {
      return NextResponse.json(
        { ok: false, error: 'Booking already claimed' },
        { status: 409 }
      );
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: 'Booking is not available' },
        { status: 409 }
      );
    }

    // Claim the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        cleaner_id: session.id,
        cleaner_claimed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .is('cleaner_id', null) // Double-check it's still available
      .select()
      .single();

    if (updateError) {
      console.error('Error claiming booking:', updateError);
      return NextResponse.json(
        { ok: false, error: 'Failed to claim booking. It may have been claimed by another cleaner.' },
        { status: 500 }
      );
    }

    if (!updatedBooking) {
      return NextResponse.json(
        { ok: false, error: 'Booking was claimed by another cleaner' },
        { status: 409 }
      );
    }

    console.log('✅ Booking claimed:', bookingId, 'by', session.name);

    return NextResponse.json({
      ok: true,
      booking: updatedBooking,
      message: 'Booking claimed successfully',
    });
  } catch (error) {
    console.error('Error in claim booking route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

