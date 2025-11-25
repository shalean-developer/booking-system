/**
 * Custom hook for fetching chart data
 */

import useSWR from 'swr';
import type { ChartDataPoint } from '@/types/admin-dashboard';
import { validateChartData } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';
import { getDateRange } from '@/lib/utils/formatting';
import type { DateRangePeriod } from '@/components/admin/shared/date-range-selector';

interface ChartResponse {
  ok: boolean;
  data?: ChartDataPoint[];
  error?: string;
}

export function useChartData(dateRange: DateRangePeriod = 'month') {
  // Get date range for API call
  const { dateFrom, dateTo } = dateRange === 'custom'
    ? { dateFrom: '', dateTo: '' }
    : getDateRange(dateRange);

  const url = dateRange === 'custom'
    ? '/api/admin/stats/chart'
    : `/api/admin/stats/chart?date_from=${dateFrom}&date_to=${dateTo}`;

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

