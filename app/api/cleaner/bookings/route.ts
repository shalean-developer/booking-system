import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, in-progress, completed
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = await createCleanerSupabaseClient();
    const cleanerId = cleanerIdToUuid(session.id);

    // 1. Fetch individual bookings (existing logic)
    let individualQuery = supabase
      .from('bookings')
      .select(`
        *,
        recurring_schedule:recurring_schedules(
          id,
          frequency,
          day_of_week,
          day_of_month,
          preferred_time,
          is_active,
          start_date,
          end_date
        )
      `)
      .eq('cleaner_id', cleanerId)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    // Apply filters to individual bookings
    if (status) {
      individualQuery = individualQuery.eq('status', status);
    }
    if (startDate) {
      individualQuery = individualQuery.gte('booking_date', startDate);
    }
    if (endDate) {
      individualQuery = individualQuery.lte('booking_date', endDate);
    }

    const { data: individualBookings, error: individualError } = await individualQuery;

    if (individualError) {
      console.error('Error fetching individual bookings:', individualError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch individual bookings' },
        { status: 500 }
      );
    }

    // 2. Fetch team bookings where cleaner is a member (if tables exist)
    let teamBookings = [];
    
    try {
      // First, get team memberships for this cleaner
      const { data: memberships, error: membershipsError } = await supabase
        .from('booking_team_members')
        .select('booking_team_id, earnings')
        .eq('cleaner_id', cleanerId);

      if (membershipsError) {
        console.log('Team booking tables not yet created, skipping team bookings');
      } else if (memberships && memberships.length > 0) {
        // Get the team IDs
        const teamIds = memberships.map(m => m.booking_team_id);
        
        // Fetch team details
        const { data: teams, error: teamsError } = await supabase
          .from('booking_teams')
          .select('id, booking_id, team_name, supervisor_id')
          .in('id', teamIds);

        if (!teamsError && teams && teams.length > 0) {
          // Get booking IDs
          const bookingIds = teams.map(t => t.booking_id);
          
          // Fetch bookings with recurring schedule
          let bookingsQuery = supabase
            .from('bookings')
            .select(`
              *,
              recurring_schedule:recurring_schedules(
                id,
                frequency,
                day_of_week,
                day_of_month,
                preferred_time,
                is_active,
                start_date,
                end_date
              )
            `)
            .in('id', bookingIds);

          // Apply date filters
          if (startDate) {
            bookingsQuery = bookingsQuery.gte('booking_date', startDate);
          }
          if (endDate) {
            bookingsQuery = bookingsQuery.lte('booking_date', endDate);
          }

          const { data: bookingsData, error: bookingsError } = await bookingsQuery;

          if (!bookingsError && bookingsData) {
            // Combine the data
            teamBookings = bookingsData.map(booking => {
              const team = teams.find(t => t.booking_id === booking.id);
              const membership = memberships.find(m => m.booking_team_id === team?.id);
              
              return {
                ...booking,
                is_team_booking: true,
                team_name: team?.team_name,
                team_role: team?.supervisor_id === cleanerId ? 'supervisor' : 'member',
                team_earnings: membership?.earnings || 0,
                team_supervisor_id: team?.supervisor_id,
              };
            });
          }
        }
      }
    } catch (err) {
      console.log('Team booking tables not available, continuing with individual bookings only:', err);
    }

    // Apply status filter to team bookings if specified
    const filteredTeamBookings = status 
      ? teamBookings.filter(booking => booking.status === status)
      : teamBookings;

    // 4. Merge individual and team bookings
    const allBookings = [
      ...(individualBookings || []).map(booking => ({
        ...booking,
        is_team_booking: false,
        team_role: null,
        team_earnings: null,
      })),
      ...filteredTeamBookings
    ];

    // 5. Sort merged results by date and time
    allBookings.sort((a, b) => {
      const dateCompare = a.booking_date.localeCompare(b.booking_date);
      if (dateCompare !== 0) return dateCompare;
      return a.booking_time.localeCompare(b.booking_time);
    });

    return NextResponse.json({
      ok: true,
      bookings: allBookings,
    });
  } catch (error) {
    console.error('Error in cleaner bookings route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

