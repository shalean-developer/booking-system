/**
 * Custom hook for fetching chart data
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import type { ChartDataPoint } from '@/types/admin-dashboard';
import { validateChartData } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';
import { getDateRange } from '@/lib/utils/formatting';
import type { DateRangePeriod, CustomDateRange } from '@/components/admin/shared/date-range-selector';

interface ChartResponse {
  ok: boolean;
  data?: ChartDataPoint[];
  error?: string;
}

export function useChartData(dateRange: DateRangePeriod = 'month', customRange?: CustomDateRange) {
  // Memoize URL to prevent infinite re-renders
  const url = useMemo(() => {
    if (dateRange === 'custom' && customRange) {
      return `/api/admin/stats/chart?date_from=${customRange.from}&date_to=${customRange.to}`;
    }
    if (dateRange === 'custom') {
      return '/api/admin/stats/chart';
    }
    const { dateFrom, dateTo } = getDateRange(dateRange);
    return `/api/admin/stats/chart?date_from=${dateFrom}&date_to=${dateTo}`;
  }, [dateRange, customRange]);

  const { data, error, isLoading, mutate } = useSWR<ChartResponse>(
    url,
    fetcher,
    {
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  );

  const chartData = data?.ok && data.data && validateChartData(data.data)
    ? data.data
    : [];

  return {
    chartData,
    isLoading,
    isError: error || (data && !data.ok),
    error: error?.message || data?.error || null,
    mutate,
  };
}

