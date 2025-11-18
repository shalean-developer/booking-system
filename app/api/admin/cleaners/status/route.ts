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

    // Determine today's date (YYYY-MM-DD in local time)
    const now = new Date();
    const todayISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    // Determine day of week for today (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = now.getDay();
    const dayColumns = [
      'available_sunday',
      'available_monday',
      'available_tuesday',
      'available_wednesday',
      'available_thursday',
      'available_friday',
      'available_saturday'
    ];
    const todayDayColumn = dayColumns[dayOfWeek];

    // Fetch active cleaners who:
    // 1. Are active (is_active = true)
    // 2. Have master toggle ON (is_available = true)
    // 3. Work on today's day of week (e.g., available_monday = true)
    // This matches the logic used in booking flow and assign cleaner API
    const { data: cleaners, error } = await supabase
      .from('cleaners')
      .select('id, name, is_active, is_available, rating')
      .eq('is_active', true)
      .eq('is_available', true)
      .eq(todayDayColumn, true) // Must be available on today's day
      .order('name', { ascending: true });

    if (error) throw error;

    // Fetch all bookings for today that would make a cleaner unavailable
    // Use same status filter as assign cleaner API: pending, accepted, in_progress
    // Also include on_my_way as these are active bookings
    const { data: todaysBookings, error: todaysBookingsError } = await supabase
      .from('bookings')
      .select('id, cleaner_id, requires_team, status')
      .eq('booking_date', todayISO)
      .in('status', ['pending', 'accepted', 'in_progress', 'on_my_way'])
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
    // These cleaners are:
    // 1. Active and available (is_active = true, is_available = true)
    // 2. Available on today's day of week (e.g., available_monday = true)
    // 3. Not assigned to any bookings today
    const cleanersWithStatus = (cleaners || [])
      .filter((cleaner) => !assignedCleanerIds.has(cleaner.id))
      .map((cleaner) => {
        // Use actual rating if available, otherwise default to 4.5
        const rating = cleaner.rating || 4.5;

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

