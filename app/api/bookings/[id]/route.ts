import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isSafeBookingLookupId } from '@/lib/booking-lookup-id';
import { verifyBookingLookupToken, isBookingLookupTokenConfigured } from '@/lib/booking-lookup-token';

/**
 * GET handler to fetch booking details by ID
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    const { searchParams } = new URL(req.url);
    const ct = searchParams.get('ct');

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!isSafeBookingLookupId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid reference' }, { status: 400 });
    }

    if (isBookingLookupTokenConfigured() && !verifyBookingLookupToken(id, ct)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const r1 = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
    if (r1.error) {
      console.error('Database error:', r1.error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch booking' },
        { status: 500 }
      );
    }

    let booking = r1.data;
    if (!booking) {
      const r2 = await supabase.from('bookings').select('*').eq('payment_reference', id).maybeSingle();
      if (r2.error) {
        return NextResponse.json({ ok: false, error: 'Failed to fetch booking' }, { status: 500 });
      }
      booking = r2.data;
    }

    if (!booking) {
      console.log('Booking not found for ID:', id);
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('Booking found:', booking.id);

    // Query cleaner details if cleaner_id exists
    let cleanerDetails = null;
    if (booking.cleaner_id && booking.cleaner_id !== 'manual') {
      const { data: cleaner } = await supabase
        .from('cleaners')
        .select('name, photo_url')
        .eq('id', booking.cleaner_id)
        .maybeSingle();
      
      cleanerDetails = cleaner;
    }

    // Query team details if requires_team
    let teamDetails = null;
    if (booking.requires_team) {
      const { data: team } = await supabase
        .from('booking_teams')
        .select('team_name, supervisor_id')
        .eq('booking_id', booking.id)
        .maybeSingle();
      
      teamDetails = team;
    }

    return NextResponse.json({
      ok: true,
      booking: {
        ...booking,
        cleaner_details: cleanerDetails,
        team_details: teamDetails,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

