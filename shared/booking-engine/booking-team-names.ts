/** Canonical team labels for `requires_team` services — matches dispatch & reschedule APIs. */
export const BOOKING_TEAM_NAMES = ['Team A', 'Team B', 'Team C'] as const;

export type BookingTeamName = (typeof BOOKING_TEAM_NAMES)[number];

export function isBookingTeamName(value: string): value is BookingTeamName {
  return (BOOKING_TEAM_NAMES as readonly string[]).includes(value);
}
