/**
 * Pay-later / unpaid booking API (`POST /api/bookings/guest`) — off by default in production.
 * Set `ALLOW_PAY_LATER_BOOKINGS=true` to enable.
 */
export function isPayLaterAllowed(): boolean {
  const v = process.env.ALLOW_PAY_LATER_BOOKINGS?.trim().toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}
