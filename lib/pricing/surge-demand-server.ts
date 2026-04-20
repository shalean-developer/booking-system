import type { SupabaseClient } from '@supabase/supabase-js';

/** Counts demand/supply for surge — booking date in YYYY-MM-DD. */
export const ACTIVE_BOOKING_STATUSES = [
  // Exclude unpaid 'pending' checkouts to avoid surge jitter while users are
  // still confirming payment (verify-price -> pending-booking roundtrip).
  'paid',
  'assigned',
  'accepted',
  'confirmed',
  'on_my_way',
  'arrived',
  'in-progress',
] as const;

/**
 * Active bookings on the given date × supply of available cleaners.
 * Area is reserved for future weighting; currently global counts keep behavior stable.
 */
export async function fetchSurgeDemandCounts(
  supabase: SupabaseClient,
  params: { date: string }
): Promise<{ available_cleaners: number; active_bookings: number }> {
  const date = params.date.slice(0, 10);

  const [bookingsRes, cleanersRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_date', date)
      .in('status', [...ACTIVE_BOOKING_STATUSES]),
    supabase
      .from('cleaners')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_available', true),
  ]);

  const active_bookings = bookingsRes.count ?? 0;
  const rawCleaners = cleanersRes.count ?? 0;

  return {
    active_bookings,
    available_cleaners: Math.max(1, rawCleaners),
  };
}
