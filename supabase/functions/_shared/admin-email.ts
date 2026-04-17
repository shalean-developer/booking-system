/** Keep logic aligned with `lib/admin-email.ts` (Next.js). */
const DEFAULT_ADMIN = 'bookings@shalean.com';
const LEGACY_BOOKINGS_CO_ZA = 'bookings@shalean.co.za';

export function resolveAdminNotificationEmail(): string {
  const raw = Deno.env.get('ADMIN_EMAIL')?.trim();
  if (!raw) return DEFAULT_ADMIN;
  if (raw.toLowerCase() === LEGACY_BOOKINGS_CO_ZA) return DEFAULT_ADMIN;
  return raw;
}
