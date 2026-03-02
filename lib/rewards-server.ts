/**
 * Server-only rewards helpers. Do not import from client code.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { POINTS_PER_COMPLETED_BOOKING } from '@/lib/rewards';

/**
 * Increment the customer's rewards_points when a booking is marked completed.
 * Call only when a booking transitions to completed (not when already completed) to avoid double-credit.
 */
export async function incrementCustomerRewardsForCompletedBooking(
  supabase: SupabaseClient,
  bookingId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('customer_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchError) {
    console.error('[rewards] Failed to fetch booking:', fetchError);
    return { ok: false, error: fetchError.message };
  }
  if (!booking?.customer_id) {
    return { ok: false, error: 'Booking or customer_id not found' };
  }

  const { data: row, error: fetchErr } = await supabase
    .from('customers')
    .select('rewards_points')
    .eq('id', booking.customer_id)
    .maybeSingle();

  if (fetchErr || row == null) {
    console.error('[rewards] Failed to fetch customer:', fetchErr);
    return { ok: false, error: fetchErr?.message ?? 'Customer not found' };
  }

  const current = typeof row.rewards_points === 'number' ? row.rewards_points : 0;
  const { error: updateErr } = await supabase
    .from('customers')
    .update({
      rewards_points: current + POINTS_PER_COMPLETED_BOOKING,
    })
    .eq('id', booking.customer_id);

  if (updateErr) {
    console.error('[rewards] Failed to increment rewards_points:', updateErr);
    return { ok: false, error: updateErr.message };
  }
  return { ok: true };
}
