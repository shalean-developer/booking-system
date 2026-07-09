const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidCleanerUuid(value: string | null | undefined): value is string {
  return !!value && value !== 'manual' && UUID_RE.test(value);
}

export type BookingCleanerFields = {
  cleaner_id?: string | null;
  assigned_cleaner_id?: string | null;
  assigned_cleaners?: string[] | null;
};

/**
 * Pick a single cleaner UUID to attach a customer→cleaner review when `cleaner_id`
 * may be null, "manual", or team/assignment uses other columns.
 */
export function resolvePrimaryCleanerUuidForReview(
  booking: BookingCleanerFields
): string | null {
  if (isValidCleanerUuid(booking.cleaner_id)) {
    return booking.cleaner_id;
  }
  if (isValidCleanerUuid(booking.assigned_cleaner_id)) {
    return booking.assigned_cleaner_id;
  }
  const ac = booking.assigned_cleaners;
  if (Array.isArray(ac)) {
    for (const id of ac) {
      if (isValidCleanerUuid(id)) return id;
    }
  }
  return null;
}
