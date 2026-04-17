/**
 * Inbox for admin booking / payment notifications (Resend `to` address).
 * Set `ADMIN_EMAIL` in `.env.local` / Vercel to the address that should receive
 * new-booking and paid-booking alerts. The value is used as-is (no domain rewriting).
 */
const DEFAULT_ADMIN = 'bookings@shalean.co.za';

export function resolveAdminNotificationEmail(
  env: { ADMIN_EMAIL?: string } = process.env as { ADMIN_EMAIL?: string },
): string {
  const raw = env.ADMIN_EMAIL?.trim();
  if (raw) return raw;
  return DEFAULT_ADMIN;
}
