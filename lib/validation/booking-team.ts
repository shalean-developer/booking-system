/**
 * Zod schemas for booking crew fields — use with `safeParse` on API bodies or fragments.
 */
import { z } from 'zod';
import { BOOKING_TEAM_NAMES } from '@/lib/constants/booking-teams';
import {
  teamSelectionSchema,
  bookingTeamFieldsSchema,
} from '@/lib/booking-team-payload';

export { teamSelectionSchema, bookingTeamFieldsSchema };

const bookingTeamEnum = z.enum(BOOKING_TEAM_NAMES);

/** Strict optional `selected_team` only — rejects placeholders and unknown strings */
export const bookingSelectedTeamSchema = z.object({
  selected_team: bookingTeamEnum.optional(),
});

export type BookingSelectedTeamInput = z.infer<typeof bookingSelectedTeamSchema>;
