/**
 * Loyalty & retention engine: tiers, earn rules, referral resolution, post-payment rewards.
 * Balance: `customers.rewards_points`. Lifetime: `customers.loyalty_lifetime_points`.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  calculatePoints,
  FIRST_BOOKING_BONUS_POINTS,
  REPEAT_WITHIN_7D_BONUS_POINTS,
  REFERRER_REWARD_POINTS,
} from '@/lib/loyalty/points';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIER_ORDER: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];

/** Completed (paid) booking counts → tier (by spec). */
export function calculateUserTierFromBookingCount(completedBookings: number): LoyaltyTier {
  const n = Math.max(0, Math.floor(completedBookings));
  if (n >= 30) return 'platinum';
  if (n >= 15) return 'gold';
  if (n >= 5) return 'silver';
  return 'bronze';
}

/** Labour-line discount percent from tier (before frequency etc.). */
export function tierDiscountPercent(tier: string | null | undefined): number {
  const t = (tier ?? 'bronze').toLowerCase();
  if (t === 'silver') return 5;
  if (t === 'gold' || t === 'platinum') return 10;
  return 0;
}

export function nextTierInfo(completedBookings: number): {
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  bookingsNeeded: number | null;
} {
  const tier = calculateUserTierFromBookingCount(completedBookings);
  const idx = TIER_ORDER.indexOf(tier);
  const next = idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
  const thresholds: Record<LoyaltyTier, number> = {
    bronze: 0,
    silver: 5,
    gold: 15,
    platinum: 30,
  };
  if (!next) return { tier, nextTier: null, bookingsNeeded: null };
  const need = Math.max(0, thresholds[next] - completedBookings);
  return { tier, nextTier: next, bookingsNeeded: need };
}

export async function insertLoyaltyTransaction(
  supabase: SupabaseClient,
  row: {
    customer_id: string;
    points_delta: number;
    reason: string;
    booking_id?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from('loyalty_transactions').insert({
    customer_id: row.customer_id,
    points_delta: row.points_delta,
    reason: row.reason,
    booking_id: row.booking_id ?? null,
    metadata: row.metadata ?? {},
  });
  if (error) {
    console.warn('[loyalty] transaction log failed', error.message);
  }
}

/**
 * Resolve `referral_code` to referrer customer id (for apply-at-checkout / profile).
 */
export async function resolveReferrerIdFromCode(
  supabase: SupabaseClient,
  code: string | null | undefined
): Promise<string | null> {
  const raw = code?.trim();
  if (!raw) return null;
  const { data } = await supabase
    .from('customers')
    .select('id')
    .ilike('referral_code', raw)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export type PostPaymentLoyaltyParams = {
  supabase: SupabaseClient;
  bookingId: string;
  customerId: string | null;
  amountZar: number;
  pointsRedeemed: number;
  bookingDateYmd: string;
};

/**
 * Idempotent: claims `loyalty_rewards_applied_at` on booking, then credits points, tier, referral.
 */
export async function runPostPaymentLoyaltyRewards(params: PostPaymentLoyaltyParams): Promise<void> {
  const { supabase, bookingId, customerId, amountZar, pointsRedeemed, bookingDateYmd } = params;
  if (!customerId) return;

  const now = new Date().toISOString();
  const { data: claimed } = await supabase
    .from('bookings')
    .update({ loyalty_rewards_applied_at: now })
    .eq('id', bookingId)
    .is('loyalty_rewards_applied_at', null)
    .select('id')
    .maybeSingle();

  if (!claimed?.id) return;

  const redeemed = Math.max(0, Math.floor(pointsRedeemed || 0));
  let earned = calculatePoints(amountZar);

  const { data: cust, error: ce } = await supabase
    .from('customers')
    .select('rewards_points, referred_by_customer_id, loyalty_lifetime_points')
    .eq('id', customerId)
    .maybeSingle();
  if (ce || !cust) {
    console.warn('[loyalty] customer fetch failed', ce);
    await supabase.from('bookings').update({ loyalty_rewards_applied_at: null }).eq('id', bookingId);
    return;
  }

  const { count: priorSuccess } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('payment_status', 'success')
    .neq('id', bookingId);

  const isFirstPaid = (priorSuccess ?? 0) === 0;
  if (isFirstPaid) {
    earned += FIRST_BOOKING_BONUS_POINTS;
  } else {
    const { data: prevRow } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('customer_id', customerId)
      .eq('payment_status', 'success')
      .neq('id', bookingId)
      .order('booking_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevRow?.booking_date) {
      const prev = new Date(String(prevRow.booking_date));
      const cur = new Date(bookingDateYmd.slice(0, 10));
      const diffMs = cur.getTime() - prev.getTime();
      const diffDays = diffMs / (86400 * 1000);
      if (diffDays >= 0 && diffDays <= 7) {
        earned += REPEAT_WITHIN_7D_BONUS_POINTS;
      }
    }
  }

  const current = Math.max(0, Math.floor(Number(cust.rewards_points) || 0));
  const lifetimePrev = Math.max(0, Math.floor(Number(cust.loyalty_lifetime_points) || 0));
  let next = current - redeemed + earned;
  if (next < 0) next = 0;
  const lifetimeNext = lifetimePrev + Math.max(0, earned);

  const { count: completedCnt } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('status', 'completed');

  const tier = calculateUserTierFromBookingCount(completedCnt ?? 0);

  const { error: up } = await supabase
    .from('customers')
    .update({
      rewards_points: next,
      loyalty_lifetime_points: lifetimeNext,
      user_tier: tier,
    })
    .eq('id', customerId);

  if (up) {
    console.error('[loyalty] update failed', up);
    await supabase.from('bookings').update({ loyalty_rewards_applied_at: null }).eq('id', bookingId);
    return;
  }

  await insertLoyaltyTransaction(supabase, {
    customer_id: customerId,
    points_delta: earned - redeemed,
    reason: 'post_payment_net',
    booking_id: bookingId,
    metadata: {
      earned_base: calculatePoints(amountZar),
      earned_total: earned,
      redeemed,
      first_paid: isFirstPaid,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[loyalty]', { earned, redeemed, balance: next, tier });
  }

  if (isFirstPaid) {
    const referrerId = cust.referred_by_customer_id;
    if (referrerId && referrerId !== customerId) {
      const { data: refRow } = await supabase
        .from('referrals')
        .select('id, reward_granted')
        .eq('referred_user_id', customerId)
        .maybeSingle();

      if (!refRow?.reward_granted) {
        if (refRow?.id) {
          await supabase
            .from('referrals')
            .update({
              status: 'completed',
              reward_granted: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', refRow.id);
        } else {
          await supabase.from('referrals').insert({
            referrer_id: referrerId,
            referred_user_id: customerId,
            status: 'completed',
            reward_granted: true,
          });
        }

        const { data: refCust } = await supabase
          .from('customers')
          .select('rewards_points, loyalty_lifetime_points')
          .eq('id', referrerId)
          .maybeSingle();
        if (refCust) {
          const rp = Math.max(0, Math.floor(Number(refCust.rewards_points) || 0));
          const lf = Math.max(0, Math.floor(Number(refCust.loyalty_lifetime_points) || 0));
          await supabase
            .from('customers')
            .update({
              rewards_points: rp + REFERRER_REWARD_POINTS,
              loyalty_lifetime_points: lf + REFERRER_REWARD_POINTS,
            })
            .eq('id', referrerId);
          await insertLoyaltyTransaction(supabase, {
            customer_id: referrerId,
            points_delta: REFERRER_REWARD_POINTS,
            reason: 'referral_completed',
            booking_id: bookingId,
            metadata: { referred_customer_id: customerId },
          });
        }
      }
    }
  }
}
