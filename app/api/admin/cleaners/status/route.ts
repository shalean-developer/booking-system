import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cleaners/status
 * Fetch cleaners with their current status and booking counts
 */
export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch active cleaners (both is_active AND is_available must be true)
    const { data: cleaners, error } = await supabase
      .from('cleaners')
      .select('id, name, is_active, is_available')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name', { ascending: true });

    if (error) throw error;

    // Determine today's date (YYYY-MM-DD in local time)
    const now = new Date();
    const todayISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    // Fetch all bookings for today that would make a cleaner unavailable
    const { data: todaysBookings, error: todaysBookingsError } = await supabase
      .from('bookings')
      .select('id, cleaner_id, requires_team')
      .eq('booking_date', todayISO)
      .neq('status', 'cancelled');

    if (todaysBookingsError) throw todaysBookingsError;

    const assignedCleanerIds = new Set<string>();

    // Individual bookings (cleaner_id directly on booking)
    (todaysBookings || []).forEach((booking) => {
      if (booking.cleaner_id && booking.cleaner_id !== 'manual') {
        assignedCleanerIds.add(booking.cleaner_id);
      }
    });

    const todaysBookingIds = (todaysBookings || []).map((booking) => booking.id);

    if (todaysBookingIds.length > 0) {
      // Fetch any teams assigned to today's bookings
      const { data: bookingTeams, error: bookingTeamsError } = await supabase
        .from('booking_teams')
        .select('id, booking_id, supervisor_id')
        .in('booking_id', todaysBookingIds);

      if (bookingTeamsError) throw bookingTeamsError;

      const teamIds = (bookingTeams || []).map((team) => team.id);

      // Include supervisors explicitly in case they aren't duplicated in the members table
      (bookingTeams || []).forEach((team) => {
        if (team.supervisor_id) {
          assignedCleanerIds.add(team.supervisor_id);
        }
      });

      if (teamIds.length > 0) {
        const { data: teamMembers, error: teamMembersError } = await supabase
          .from('booking_team_members')
          .select('cleaner_id, booking_team_id')
          .in('booking_team_id', teamIds);

        if (teamMembersError) throw teamMembersError;

        (teamMembers || []).forEach((member) => {
          if (member.cleaner_id) {
            assignedCleanerIds.add(member.cleaner_id);
          }
        });
      }
    }

    // Only return cleaners who have no assignments for today
    const cleanersWithStatus = (cleaners || [])
      .filter((cleaner) => !assignedCleanerIds.has(cleaner.id))
      .map((cleaner) => {
        const rating = 4.5 + Math.random() * 0.5;

        return {
          id: cleaner.id,
          name: cleaner.name,
          status: 'available' as const,
          currentBookings: 0,
          rating: parseFloat(rating.toFixed(1)),
        };
      });

    return NextResponse.json({
      ok: true,
      cleaners: cleanersWithStatus.slice(0, 10), // Limit to 10 for dashboard
    });
  } catch (error: any) {
    console.error('Error fetching cleaners status:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch cleaners status' },
      { status: 500 }
    );
  }
}

