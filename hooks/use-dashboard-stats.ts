/**
 * Custom hook for fetching dashboard statistics
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import type { DashboardStats } from '@/types/admin-dashboard';
import { validateDashboardStats } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';
import { getDateRange } from '@/lib/utils/formatting';
import type { DateRangePeriod, CustomDateRange } from '@/components/admin/shared/date-range-selector';

interface StatsResponse {
  ok: boolean;
  stats?: DashboardStats;
  error?: string;
}

export function useDashboardStats(dateRange: DateRangePeriod = 'month', customRange?: CustomDateRange) {
  // Memoize URL to prevent infinite re-renders
  const url = useMemo(() => {
    if (dateRange === 'custom' && customRange) {
      return `/api/admin/stats?date_from=${customRange.from}&date_to=${customRange.to}`;
    }
    if (dateRange === 'custom') {
      return '/api/admin/stats';
    }
    const { dateFrom, dateTo } = getDateRange(dateRange);
    return `/api/admin/stats?date_from=${dateFrom}&date_to=${dateTo}`;
  }, [dateRange, customRange]);
  
  const { data, error, isLoading, mutate } = useSWR<StatsResponse>(
    url,
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

