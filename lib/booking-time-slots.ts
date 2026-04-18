/** Max concurrent bookings allowed per calendar day start time (hour slot). */
export const MAX_BOOKINGS_PER_TIME_SLOT = 5;

/** Standard booking start times with labels — single source for public booking UIs. */
export const BOOKING_TIME_SLOT_DEFS = [
  { id: '07:00', label: '7:00 AM' },
  { id: '08:00', label: '8:00 AM' },
  { id: '09:00', label: '9:00 AM' },
  { id: '10:00', label: '10:00 AM' },
  { id: '11:00', label: '11:00 AM' },
  { id: '12:00', label: '12:00 PM' },
  { id: '13:00', label: '1:00 PM' },
  { id: '14:00', label: '2:00 PM' },
  { id: '15:00', label: '3:00 PM' },
  { id: '16:00', label: '4:00 PM' },
] as const;

/** Standard booking start times (HH:MM), aligned with main booking flow. */
export const STANDARD_BOOKING_TIME_IDS = BOOKING_TIME_SLOT_DEFS.map((d) => d.id);

export type StandardBookingTimeId = (typeof BOOKING_TIME_SLOT_DEFS)[number]['id'];

const STANDARD_ID_SET = new Set<string>(STANDARD_BOOKING_TIME_IDS);

/**
 * Map a stored booking_time to the hour-based slot id (07:00–16:00).
 * Uses the hour component; minutes only matter for parsing the hour (e.g. 10:30 → 10:00).
 */
export function normalizeBookingTimeToSlotId(bookingTime: string | null | undefined): string | null {
  if (bookingTime == null || bookingTime === '') return null;
  const m = String(bookingTime).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const id = `${String(h).padStart(2, '0')}:00`;
  return STANDARD_ID_SET.has(id) ? id : null;
}
