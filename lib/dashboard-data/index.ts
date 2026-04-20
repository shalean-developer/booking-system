/**
 * Server-side dashboard data facades — call from API routes and RSC pages only.
 * Pure rules live under `shared/dashboard-data` and `shared/finance-engine`.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getCustomerDashboardStats } from './customer-stats';

export type { CustomerDashboardStats } from './customer-stats';
export { getCustomerDashboardStats };

export type { ProfitDashboardData, ProfitDashboardFilters } from '@/lib/admin/profit-dashboard-data';
export { fetchProfitDashboardData as getAdminDashboardData } from '@/lib/admin/profit-dashboard-data';

export type { CleanerFinancialData } from '@/lib/cleaner-financial';
export { getCleanerFinancialData as getCleanerDashboardData } from '@/lib/cleaner-financial';

/** Resolve customer id from auth user id, then load stats (throws if customer missing). */
export async function getCustomerDashboardData(
  supabase: SupabaseClient,
  authUserId: string
): Promise<{ customerId: string; stats: import('./customer-stats').CustomerDashboardStats } | null> {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, rewards_points, loyalty_lifetime_points')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!customer) return null;

  const stats = await getCustomerDashboardStats(
    supabase,
    customer.id as string,
    Math.max(0, Math.round(Number(customer.rewards_points) || 0)),
    (customer as { loyalty_lifetime_points?: number | null }).loyalty_lifetime_points
  );

  return { customerId: customer.id as string, stats };
}
