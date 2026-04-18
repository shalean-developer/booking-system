/** Critical delay: en route but job not started (used by SLA + auto-reassign). */
export const SLA_ISSUE_ON_WAY_NOT_STARTED = 'Cleaner on the way but not started after 45 min';

type BookingLike = {
  id?: string;
  status?: string | null;
  accepted_at?: string | null;
  on_my_way_at?: string | null;
  started_at?: string | null;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
};

function pickIso(
  primary: string | null | undefined,
  fallback: string | null | undefined
): string | null {
  const a = primary?.trim();
  if (a) return a;
  const b = fallback?.trim();
  return b || null;
}

/**
 * Flags workflow delays for admin review (accepted → en route → started).
 */
export function checkBookingSLA(booking: BookingLike): string[] {
  const issues: string[] = [];
  const status = String(booking.status || '');

  if (['completed', 'cancelled', 'declined'].includes(status)) {
    return issues;
  }

  const now = Date.now();

  const acceptedAt = pickIso(booking.accepted_at, booking.cleaner_accepted_at);
  const onMyWayAt = pickIso(booking.on_my_way_at, booking.cleaner_on_my_way_at);
  const startedAt = pickIso(booking.started_at, booking.cleaner_started_at);

  if (acceptedAt) {
    const accepted = new Date(acceptedAt).getTime();
    if (
      Number.isFinite(accepted) &&
      now - accepted > 30 * 60 * 1000 &&
      !onMyWayAt &&
      ['accepted', 'assigned', 'confirmed'].includes(status)
    ) {
      issues.push('Cleaner accepted but not on the way after 30 min');
    }
  }

  if (onMyWayAt) {
    const onWay = new Date(onMyWayAt).getTime();
    if (Number.isFinite(onWay) && now - onWay > 45 * 60 * 1000 && !startedAt) {
      issues.push(SLA_ISSUE_ON_WAY_NOT_STARTED);
    }
  }

  return issues;
}
