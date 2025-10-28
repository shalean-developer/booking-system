import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching booking details for ID:', id);

    // Query bookings table
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .or(`payment_reference.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (bookingError) {
      console.error('Database error:', bookingError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch booking' },
        { status: 500 }
      );
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

