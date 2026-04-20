/**
 * Canonical crew identifiers for `requires_team` services (Deep / Move In/Out).
 * Must stay aligned with `check_date_availability` / `booking_teams` naming.
 */

export const BOOKING_TEAM_NAMES = ['Team A', 'Team B', 'Team C'] as const;

export type BookingTeam = (typeof BOOKING_TEAM_NAMES)[number];

/** @deprecated Use `BookingTeam` — kept for older imports */
export type BookingTeamName = BookingTeam;

export function isBookingTeamName(value: unknown): value is BookingTeam {
  return typeof value === 'string' && (BOOKING_TEAM_NAMES as readonly string[]).includes(value);
}

/**
 * Explicit auto vs manual crew choice — maps to `selected_team` on the wire:
 * - `auto` → `undefined` (dispatch assigns a crew)
 * - `manual` → concrete `BookingTeam`
 */
export type TeamSelection = { type: 'auto' } | { type: 'manual'; team: BookingTeam };

export function selectedTeamFromTeamSelection(
  selection: TeamSelection | undefined | null
): BookingTeam | undefined {
  if (!selection || selection.type === 'auto') return undefined;
  return selection.team;
}

/**
 * Strips invalid / placeholder strings. Never returns a non-canonical label.
 */
export function sanitizeSelectedTeamInput(value: unknown): BookingTeam | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') {
    console.warn('[booking-teams] INVALID TEAM RECEIVED (non-string):', value);
    return undefined;
  }
  const t = value.trim();
  if (!t) return undefined;
  if (!isBookingTeamName(t)) {
    console.warn('[booking-teams] INVALID TEAM RECEIVED:', value);
    return undefined;
  }
  return t;
}
