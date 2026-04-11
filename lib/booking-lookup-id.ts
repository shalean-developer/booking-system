/**
 * Safe booking id / payment reference for Supabase filters (avoid PostgREST filter injection).
 */
const SAFE_LOOKUP = /^[A-Za-z0-9._-]{1,200}$/;

export function isSafeBookingLookupId(raw: string | null | undefined): raw is string {
  return typeof raw === 'string' && SAFE_LOOKUP.test(raw);
}
