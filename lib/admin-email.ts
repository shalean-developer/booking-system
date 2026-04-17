/**
 * Inbox for admin booking/payment notifications (Resend `to` address).
 * `ADMIN_EMAIL` in env overrides; many deployments had the wrong TLD by mistake.
 */
const DEFAULT_ADMIN = 'bookings@shalean.com';
const LEGACY_BOOKINGS_CO_ZA = 'bookings@shalean.co.za';

export function resolveAdminNotificationEmail(
  env: { ADMIN_EMAIL?: string } = process.env as { ADMIN_EMAIL?: string },
): string {
  const raw = env.ADMIN_EMAIL?.trim();
  if (!raw) return DEFAULT_ADMIN;
  if (raw.toLowerCase() === LEGACY_BOOKINGS_CO_ZA) return DEFAULT_ADMIN;
  return raw;
}
