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
  const key = '/api/admin/stats';
  
  const { data, error, isLoading, mutate } = useSWR<StatsResponse>(
    key,
    fetcher,
    {
      revalidateOnMount: true,
      refreshInterval: 0, // Disable auto-refresh by default
    }
  );

  // Handle data validation
  let stats = null;
  if (data?.ok && data.stats) {
    if (validateDashboardStats(data.stats)) {
      stats = data.stats;
    } else {
      console.warn('[useDashboardStats] Validation failed for stats data');
    }
  }

  return {
    stats,
    isLoading,
    isError: !!error || (data !== undefined && !data?.ok),
    error: error?.message || data?.error || null,
    mutate, // For manual revalidation
  };
}

