/**
 * Custom hook for fetching service breakdown data
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import type { ServiceBreakdownItem } from '@/types/admin-dashboard';
import { validateServiceBreakdown } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';
import { getDateRange } from '@/lib/utils/formatting';
import type { DateRangePeriod, CustomDateRange } from '@/components/admin/shared/date-range-selector';

interface ServiceBreakdownResponse {
  ok: boolean;
  data?: ServiceBreakdownItem[];
  error?: string;
}

export function useServiceBreakdown(dateRange: DateRangePeriod = 'month', customRange?: CustomDateRange) {
  // Memoize URL to prevent infinite re-renders
  const url = useMemo(() => {
    if (dateRange === 'custom' && customRange) {
      return `/api/admin/stats/service-breakdown?date_from=${customRange.from}&date_to=${customRange.to}`;
    }
    if (dateRange === 'custom') {
      return '/api/admin/stats/service-breakdown';
    }
    const { dateFrom, dateTo } = getDateRange(dateRange);
    return `/api/admin/stats/service-breakdown?date_from=${dateFrom}&date_to=${dateTo}`;
  }, [dateRange, customRange]);
  
  const { data, error, isLoading, mutate } = useSWR<ServiceBreakdownResponse>(
    url,
    fetcher,
    {
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  );

  const serviceBreakdown = data?.ok && data.data && validateServiceBreakdown(data.data)
    ? data.data
    : [];

  return {
    serviceBreakdown,
    isLoading,
    isError: error || (data && !data.ok),
    error: error?.message || data?.error || null,
    mutate,
  };
}

