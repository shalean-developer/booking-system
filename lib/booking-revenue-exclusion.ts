/**
 * Shared rules: which bookings must not count toward admin revenue / chart totals.
 * Refunded and cancelled jobs should not inflate revenue metrics.
 */

export function isExcludedFromRevenueReporting(booking: {
  payment_status?: string | null;
  status?: string | null;
}): boolean {
  const ps = String(booking.payment_status || '').toLowerCase();
  const st = String(booking.status || '').toLowerCase();
  if (ps === 'refunded') return true;
  if (st === 'cancelled' || st === 'canceled') return true;
  return false;
}
