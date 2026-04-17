/**
 * Inbox for admin booking/payment notifications (Resend `to` address).
 * `ADMIN_EMAIL` in env overrides; normalize legacy .com value to .co.za.
 */
const DEFAULT_ADMIN = 'bookings@shalean.co.za';
const LEGACY_BOOKINGS_COM = 'bookings@shalean.com';

export function resolveAdminNotificationEmail(
  env: { ADMIN_EMAIL?: string } = process.env as { ADMIN_EMAIL?: string },
): string {
  const raw = env.ADMIN_EMAIL?.trim();
  if (!raw) return DEFAULT_ADMIN;
  if (raw.toLowerCase() === LEGACY_BOOKINGS_COM) return DEFAULT_ADMIN;
  return raw;
}
