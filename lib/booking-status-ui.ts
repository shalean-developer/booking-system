/**
 * Map DB booking statuses to a small set of UI labels used in admin tables.
 */

export type AdminUiBookingStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export function normalizeBookingStatusForUi(status: string | null | undefined): AdminUiBookingStatus {
  const s = (status || '').toLowerCase().trim();
  if (s === 'cancelled' || s === 'canceled' || s === 'declined') return 'cancelled';
  if (s === 'completed') return 'completed';
  /** Paystack-paid bookings are stored as DB status `paid` — must not show as workflow "Pending". */
  if (s === 'paid') return 'paid';
  if (s === 'pending' || s === 'reschedule_requested' || s === '') {
    return 'pending';
  }
  return 'confirmed';
}

export function uiStatusMatchesFilter(
  dbStatus: string | null | undefined,
  filter: AdminUiBookingStatus | 'all'
): boolean {
  if (filter === 'all') return true;
  return normalizeBookingStatusForUi(dbStatus) === filter;
}
