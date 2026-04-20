/**
 * Server-only rewards helpers. Do not import from client code.
 * Primary points credit: payment success (`supabase/functions/_shared/loyalty-rewards.ts`).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Legacy hook when a booking is marked completed — points are awarded at payment, not here.
 */
export async function incrementCustomerRewardsForCompletedBooking(
  _supabase: SupabaseClient,
  _bookingId: string
): Promise<{ ok: boolean; error?: string }> {
  return { ok: true };
}
