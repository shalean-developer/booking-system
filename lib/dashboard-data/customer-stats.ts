import type { SupabaseClient } from '@supabase/supabase-js';

/** Same payload as GET /api/dashboard/stats — single source for customer KPIs. */
export type CustomerDashboardStats = {
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  activePlans: number;
  rewardPoints: number;
  lastCleaningCompleted: string | null;
  balanceDue: number;
};

/**
 * Computes customer dashboard stats for a known `customers.id` (not auth id).
 * Mirrors `app/api/dashboard/stats/route.ts` query rules.
 */
export async function getCustomerDashboardStats(
  supabase: SupabaseClient,
  customerId: string,
  rewardsPoints: number
): Promise<CustomerDashboardStats> {
  const rewardPoints = Math.max(0, Math.round(Number(rewardsPoints) || 0));

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
  ]);

  if (upcomingErr || completedErr || cancelledErr) {
    throw new Error(upcomingErr?.message || completedErr?.message || cancelledErr?.message || 'stats failed');
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

  return {
    upcomingCount: upcomingCount ?? 0,
    completedCount: completedCount ?? 0,
    cancelledCount: cancelledCount ?? 0,
    activePlans: plansErr ? 0 : (activePlansCount ?? 0),
    rewardPoints,
    lastCleaningCompleted: lastCompleted?.booking_date ?? null,
    balanceDue,
  };
}
