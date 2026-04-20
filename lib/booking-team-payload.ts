import { z } from 'zod';
import {
  BOOKING_TEAM_NAMES,
  sanitizeSelectedTeamInput,
  selectedTeamFromTeamSelection,
  type BookingTeam,
  type TeamSelection,
} from '@/lib/constants/booking-teams';

const bookingTeamEnum = z.enum(BOOKING_TEAM_NAMES);

/** Validates `team_selection` for booking APIs */
export const teamSelectionSchema: z.ZodType<TeamSelection> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('auto') }),
  z.object({ type: z.literal('manual'), team: bookingTeamEnum }),
]);

/** Partial booking fields — use for stripping invalid `selected_team` without full body validation */
export const bookingTeamFieldsSchema = z.object({
  team_selection: teamSelectionSchema.optional(),
  selected_team: z
    .union([bookingTeamEnum, z.literal(''), z.literal(undefined)])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type BookingTeamFields = z.infer<typeof bookingTeamFieldsSchema>;

/**
 * Single resolver for all booking routes: prefers `team_selection` when valid,
 * otherwise sanitizes legacy `selected_team`.
 */
export function resolveBookingSelectedTeam(input: unknown): BookingTeam | undefined {
  if (input == null || typeof input !== 'object') {
    return sanitizeSelectedTeamInput(undefined);
  }
  const o = input as Record<string, unknown>;

  if (o.team_selection != null) {
    const parsed = teamSelectionSchema.safeParse(o.team_selection);
    if (parsed.success) {
      return selectedTeamFromTeamSelection(parsed.data);
    }
    console.warn('[booking-team-payload] invalid team_selection ignored', o.team_selection);
  }

  return sanitizeSelectedTeamInput(o.selected_team);
}
