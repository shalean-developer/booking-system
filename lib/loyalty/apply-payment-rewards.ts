/**
 * Next.js payment pipeline — delegates to `loyaltyEngine.runPostPaymentLoyaltyRewards`.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { runPostPaymentLoyaltyRewards } from '@/lib/loyalty/loyaltyEngine';

export async function applyLoyaltyAndReferralRewardsOnPayment(params: {
  supabase: SupabaseClient;
  bookingId: string;
  customerId: string | null;
  amountZar: number;
  pointsRedeemed: number;
  /** Booking date YYYY-MM-DD (for repeat-within-7-days bonus). */
  bookingDateYmd?: string;
}): Promise<void> {
  await runPostPaymentLoyaltyRewards({
    supabase: params.supabase,
    bookingId: params.bookingId,
    customerId: params.customerId,
    amountZar: params.amountZar,
    pointsRedeemed: params.pointsRedeemed,
    bookingDateYmd: params.bookingDateYmd ?? new Date().toISOString().slice(0, 10),
  });
}
