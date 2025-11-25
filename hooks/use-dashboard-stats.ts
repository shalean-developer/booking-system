/**
 * Custom hook for fetching dashboard statistics
 */

import useSWR from 'swr';
import type { DashboardStats } from '@/types/admin-dashboard';
import { validateDashboardStats } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';

interface StatsResponse {
  ok: boolean;
  stats?: DashboardStats;
  error?: string;
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<StatsResponse>(
    '/api/admin/stats',
    fetcher,
    {
      revalidateOnMount: true,
      refreshInterval: 0, // Disable auto-refresh by default
    }
  );

  const stats = data?.ok && data.stats && validateDashboardStats(data.stats) 
    ? data.stats 
    : null;

  return {
    stats,
    isLoading,
    isError: error || (data && !data.ok),
    error: error?.message || data?.error || null,
    mutate, // For manual revalidation
  };
}

