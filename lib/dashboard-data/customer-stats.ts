import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoyaltyTier } from '@/lib/loyalty/loyaltyEngine';
import {
  calculateUserTierFromBookingCount,
  nextTierInfo,
} from '@/lib/loyalty/loyaltyEngine';

/** Same payload as GET /api/dashboard/stats — single source for customer KPIs. */
export type CustomerDashboardStats = {
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  activePlans: number;
  rewardPoints: number;
  lastCleaningCompleted: string | null;
  balanceDue: number;
  /** All bookings for this customer (lifetime). */
  totalBookings: number;
  /** Sum of `total_amount` (cents) for completed bookings. */
  totalSpentCents: number;
  /** Sum of `total_hours` for completed bookings (whole hours). */
  hoursCleaned: number;
  /** Normalized tier from DB or derived from completed count. */
  userTier: string;
  /** Lifetime points earned (customers.loyalty_lifetime_points). */
  loyaltyLifetimePoints: number;
  /** Capitalized next tier name, or null at Platinum. */
  nextTierName: string | null;
  /** Completed-booking count required to reach nextTierName (5 / 15 / 30). */
  nextTierBookingThreshold: number | null;
};

const NEXT_TIER_THRESHOLD = {
  silver: 5,
  gold: 15,
  platinum: 30,
} as const satisfies Record<Exclude<LoyaltyTier, 'bronze'>, number>;

/**
 * Computes customer dashboard stats for a known `customers.id` (not auth id).
 * Mirrors `app/api/dashboard/stats/route.ts` query rules.
 */
export async function getCustomerDashboardStats(
  supabase: SupabaseClient,
  customerId: string,
  rewardsPoints: number,
  loyaltyLifetimePointsFromDb?: number | null
): Promise<CustomerDashboardStats> {
  const rewardPoints = Math.max(0, Math.round(Number(rewardsPoints) || 0));
  const loyaltyLifetimePoints = Math.max(
    0,
    Math.round(Number(loyaltyLifetimePointsFromDb) || 0)
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = today.toISOString().split('T')[0];

  const base = () =>
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('customer_id', customerId);

  const [
    { count: upcomingCount, error: upcomingErr },
    { count: completedCount, error: completedErr },
    { count: cancelledCount, error: cancelledErr },
    { count: activePlansCount, error: plansErr },
    { count: totalBookingsCount, error: totalBookingsErr },
  ] = await Promise.all([
    base()
      .gte('booking_date', todayStr)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .neq('status', 'canceled')
      .neq('status', 'declined'),
    base().eq('status', 'completed'),
    base().in('status', ['cancelled', 'canceled', 'declined']),
    supabase
      .from('recurring_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('is_active', true),
    base(),
  ]);

  if (upcomingErr || completedErr || cancelledErr || totalBookingsErr) {
    throw new Error(
      upcomingErr?.message ||
        completedErr?.message ||
        cancelledErr?.message ||
        totalBookingsErr?.message ||
        'stats failed'
    );
  }

  const { data: lastCompleted } = await supabase
    .from('bookings')
    .select('booking_date')
    .eq('customer_id', customerId)
    .eq('status', 'completed')
    .order('booking_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: unpaidBookings } = await supabase
    .from('bookings')
    .select('total_amount')
    .eq('customer_id', customerId)
    .is('payment_reference', null)
    .neq('status', 'cancelled')
    .neq('status', 'canceled')
    .neq('status', 'completed');

  const balanceDue = (unpaidBookings || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const { data: completedTotals } = await supabase
    .from('bookings')
    .select('total_amount, total_hours')
    .eq('customer_id', customerId)
    .eq('status', 'completed');

  let totalSpentCents = 0;
  let hoursCleaned = 0;
  for (const row of completedTotals || []) {
    totalSpentCents += Number(row.total_amount) || 0;
    hoursCleaned += Number(row.total_hours) || 0;
  }

  const done = completedCount ?? 0;
  /** Single source of truth with loyalty engine (same as post-payment tier updates). */
  const userTier = calculateUserTierFromBookingCount(done);

  const { nextTier } = nextTierInfo(done);
  let nextTierName: string | null = null;
  let nextTierBookingThreshold: number | null = null;
  if (nextTier === 'silver' || nextTier === 'gold' || nextTier === 'platinum') {
    nextTierBookingThreshold = NEXT_TIER_THRESHOLD[nextTier];
    nextTierName = nextTier.charAt(0).toUpperCase() + nextTier.slice(1);
  }

  return {
    upcomingCount: upcomingCount ?? 0,
    completedCount: done,
    cancelledCount: cancelledCount ?? 0,
    activePlans: plansErr ? 0 : (activePlansCount ?? 0),
    rewardPoints,
    lastCleaningCompleted: lastCompleted?.booking_date ?? null,
    balanceDue,
    totalBookings: totalBookingsCount ?? 0,
    totalSpentCents,
    hoursCleaned,
    userTier,
    loyaltyLifetimePoints,
    nextTierName,
    nextTierBookingThreshold,
  };
}
