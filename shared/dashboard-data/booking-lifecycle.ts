/**
 * Shared booking lifecycle predicates for customer, admin, and cleaner UIs.
 */

const TERMINAL_BOOKING_STATUSES = new Set(['completed', 'cancelled', 'canceled', 'declined']);

export function getTodayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isCompletedBooking(status: string | null | undefined): boolean {
  return (status || '').toLowerCase().trim() === 'completed';
}

export function isCancelledBooking(status: string | null | undefined): boolean {
  const s = (status || '').toLowerCase().trim();
  return s === 'cancelled' || s === 'canceled' || s === 'declined';
}

/**
 * Customer dashboard: future (or today) non-terminal bookings — same rules as stats KPIs.
 * Pass `dbStatus` (raw DB status) or `status`.
 */
export function isUpcomingBooking(b: {
  dbStatus?: string | null;
  status?: string | null;
  bookingDateIso?: string | null;
}): boolean {
  const raw = ((b.dbStatus ?? b.status) || '').toLowerCase();
  if (TERMINAL_BOOKING_STATUSES.has(raw)) return false;
  const iso = b.bookingDateIso?.trim();
  if (!iso) return false;
  const ymd = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  return ymd >= getTodayYmdLocal();
}

/** Maps raw DB status to customer card filter buckets. */
export function normalizeCustomerFacingStatus(
  status: string | null | undefined
): 'upcoming' | 'completed' | 'cancelled' {
  const s = (status || '').toLowerCase();
  if (s === 'cancelled' || s === 'canceled' || s === 'declined') return 'cancelled';
  if (s === 'completed') return 'completed';
  return 'upcoming';
}

/**
 * Customer bookings list "past" bucket: completed/cancelled OR scheduled date before today.
 */
export function isPastBookingListEntry(b: {
  status?: string | null;
  booking_date?: string | null;
}): boolean {
  if (isCompletedBooking(b.status) || isCancelledBooking(b.status)) return true;
  const iso = b.booking_date?.trim();
  if (!iso || iso.length < 10) return false;
  return iso.slice(0, 10) < getTodayYmdLocal();
}
