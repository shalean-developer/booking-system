import type { SupabaseClient } from '@supabase/supabase-js';

export type BookingAssignmentRow = {
  cleaner_id?: string | null;
  assigned_cleaner_id?: string | null;
  assigned_cleaners?: string[] | null;
  requires_team?: boolean | null;
};

/**
 * Whether the cleaner is allowed to act on this booking (individual assignee or team member).
 */
export async function isCleanerAssignedToBooking(
  supabase: SupabaseClient,
  bookingId: string,
  cleanerUuid: string,
  booking: BookingAssignmentRow
): Promise<boolean> {
  if (booking.cleaner_id === cleanerUuid || booking.assigned_cleaner_id === cleanerUuid) {
    return true;
  }
  const ac = booking.assigned_cleaners;
  if (Array.isArray(ac) && ac.includes(cleanerUuid)) {
    return true;
  }
  if (booking.requires_team) {
    try {
      const { data: teamMembership } = await supabase
        .from('booking_team_members')
        .select(`
          booking_team_id,
          booking_teams!inner(booking_id)
        `)
        .eq('cleaner_id', cleanerUuid);

      if (teamMembership && teamMembership.length > 0) {
        return teamMembership.some((membership) => {
          const teams = membership.booking_teams as
            | { booking_id: string }
            | { booking_id: string }[]
            | null
            | undefined;
          if (Array.isArray(teams)) {
            return teams.some((t) => t.booking_id === bookingId);
          }
          return teams?.booking_id === bookingId;
        });
      }
    } catch {
      return false;
    }
  }
  return false;
}
