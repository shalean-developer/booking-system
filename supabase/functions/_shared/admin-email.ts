/** Keep logic aligned with `lib/admin-email.ts` (Next.js). */
const DEFAULT_ADMIN = 'bookings@shalean.co.za';
const LEGACY_BOOKINGS_COM = 'bookings@shalean.com';

export function resolveAdminNotificationEmail(): string {
  const raw = Deno.env.get('ADMIN_EMAIL')?.trim();
  if (!raw) return DEFAULT_ADMIN;
  if (raw.toLowerCase() === LEGACY_BOOKINGS_COM) return DEFAULT_ADMIN;
  return raw;
}
