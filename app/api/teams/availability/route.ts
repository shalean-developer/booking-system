import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const service = searchParams.get('service');

    if (!date || !service) {
      return NextResponse.json(
        { ok: false, error: 'Date and service are required' },
        { status: 400 }
      );
    }

    // Only check for Deep and Move In/Out services
    if (service !== 'Deep' && service !== 'Move In/Out') {
      return NextResponse.json(
        { ok: true, bookedTeams: [] },
        { status: 200 }
      );
    }

    // Query bookings first, then get their team assignments
    // This is more efficient than joining
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', date)
      .eq('service_type', service)
      .neq('status', 'cancelled')
      .eq('requires_team', true);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch team availability' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        ok: true,
        bookedTeams: [],
      });
    }

    // Get team assignments for these bookings
    const bookingIds = bookings.map(b => b.id);
    const { data: bookedTeamsData, error } = await supabase
      .from('booking_teams')
      .select('team_name')
      .in('booking_id', bookingIds);

    if (error) {
      console.error('Error fetching team availability:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch team availability' },
        { status: 500 }
      );
    }

    // Extract unique team names from the results
    const bookedTeams = bookedTeamsData
      ? [...new Set(bookedTeamsData.map((item: any) => item.team_name))]
      : [];

    return NextResponse.json({
      ok: true,
      bookedTeams,
    });
  } catch (error) {
    console.error('Error in team availability API:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
