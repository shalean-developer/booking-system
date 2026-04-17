/** Keep logic aligned with `lib/admin-email.ts` (Next.js). */
const DEFAULT_ADMIN = 'bookings@shalean.co.za';

export function resolveAdminNotificationEmail(): string {
  const raw = Deno.env.get('ADMIN_EMAIL')?.trim();
  if (raw) return raw;
  return DEFAULT_ADMIN;
}
