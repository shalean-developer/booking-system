import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/** 1 point per R10 spent (matches lib/loyalty/points.ts). */
export function calculatePointsEarned(zar: number): number {
  if (!Number.isFinite(zar) || zar <= 0) return 0;
  return Math.floor(zar / 10);
}

const REFERRER_BONUS_POINTS = 50;

/**
 * After booking is marked paid: apply redeemed points, award earned points, complete referral.
 */
export async function applyLoyaltyAndReferralRewards(params: {
  supabase: SupabaseClient;
  bookingId: string;
  customerId: string | null;
  amountZar: number;
  pointsRedeemed: number;
}): Promise<void> {
  const { supabase, bookingId, customerId, amountZar, pointsRedeemed } = params;
  if (!customerId) return;

  const now = new Date().toISOString();
  const { data: claimed } = await supabase
    .from('bookings')
    .update({ loyalty_rewards_applied_at: now })
    .eq('id', bookingId)
    .is('loyalty_rewards_applied_at', null)
    .select('id')
    .maybeSingle();

  if (!claimed?.id) {
    return;
  }

  const earned = calculatePointsEarned(amountZar);
  const redeemed = Math.max(0, Math.floor(pointsRedeemed || 0));

  const { data: cust, error: ce } = await supabase
    .from('customers')
    .select('rewards_points, referred_by_customer_id')
    .eq('id', customerId)
    .maybeSingle();
  if (ce || !cust) {
    console.warn('[loyalty] customer fetch failed', ce);
    return;
  }

  const current = Math.max(0, Math.floor(Number(cust.rewards_points) || 0));
  let next = current - redeemed + earned;
  if (next < 0) next = 0;

  const { error: up } = await supabase
    .from('customers')
    .update({ rewards_points: next })
    .eq('id', customerId);
  if (up) {
    console.error('[loyalty] update failed', up);
    await supabase.from('bookings').update({ loyalty_rewards_applied_at: null }).eq('id', bookingId);
    return;
  }

  console.log('[loyalty]', {
    points_earned: earned,
    points_used: redeemed,
    remaining_points: next,
  });

  const { count: priorOther } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('payment_status', 'success')
    .neq('id', bookingId);

  if ((priorOther ?? 0) > 0) return;

  const referrerId = cust.referred_by_customer_id;
  if (!referrerId || referrerId === customerId) return;

  const { data: refRow } = await supabase
    .from('referrals')
    .select('id, reward_granted')
    .eq('referred_user_id', customerId)
    .maybeSingle();

  if (refRow?.reward_granted) return;

  if (refRow?.id) {
    await supabase
      .from('referrals')
      .update({ status: 'completed', reward_granted: true, updated_at: new Date().toISOString() })
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
    .select('rewards_points')
    .eq('id', referrerId)
    .maybeSingle();
  if (refCust) {
    const rp = Math.max(0, Math.floor(Number(refCust.rewards_points) || 0));
    await supabase
      .from('customers')
      .update({ rewards_points: rp + REFERRER_BONUS_POINTS })
      .eq('id', referrerId);
  }

  console.log('[referral]', {
    referrer_id: referrerId,
    referred_user_id: customerId,
    reward: REFERRER_BONUS_POINTS,
  });
}
