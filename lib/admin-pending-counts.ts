import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminPendingCounts = {
  pendingQuotes: number;
  pendingApplications: number;
  pendingBookings: number;
};

/**
 * Single source of truth for admin sidebar / alerts pending tallies.
 * Keep in sync with any UI that shows these numbers.
 */
export async function fetchAdminPendingCounts(supabase: SupabaseClient): Promise<AdminPendingCounts> {
  const [quotesRes, appsRes, bookingsRes] = await Promise.all([
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  if (quotesRes.error) {
    console.error('[admin-pending-counts] quotes:', quotesRes.error.message);
  }
  if (appsRes.error) {
    console.error('[admin-pending-counts] applications:', appsRes.error.message);
  }
  if (bookingsRes.error) {
    console.error('[admin-pending-counts] bookings:', bookingsRes.error.message);
  }

  return {
    pendingQuotes: quotesRes.count ?? 0,
    pendingApplications: appsRes.count ?? 0,
    pendingBookings: bookingsRes.count ?? 0,
  };
}
