/**
 * Custom hook for fetching booking pipeline data
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import type { BookingPipeline } from '@/types/admin-dashboard';
import { validateBookingPipeline } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';
import { getDateRange } from '@/lib/utils/formatting';
import type { DateRangePeriod, CustomDateRange } from '@/components/admin/shared/date-range-selector';

interface PipelineResponse {
  ok: boolean;
  pipeline?: BookingPipeline;
  error?: string;
}

export function useBookingPipeline(dateRange: DateRangePeriod = 'month', customRange?: CustomDateRange) {
  // Memoize URL to prevent infinite re-renders
  const url = useMemo(() => {
    if (dateRange === 'custom' && customRange) {
      return `/api/admin/stats/booking-pipeline?date_from=${customRange.from}&date_to=${customRange.to}`;
    }
    if (dateRange === 'custom') {
      return '/api/admin/stats/booking-pipeline';
    }
    const { dateFrom, dateTo } = getDateRange(dateRange);
    return `/api/admin/stats/booking-pipeline?date_from=${dateFrom}&date_to=${dateTo}`;
  }, [dateRange, customRange]);
  
  const { data, error, isLoading, mutate } = useSWR<PipelineResponse>(
    url,
    fetcher,
    {
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  );

  const pipeline = data?.ok && data.pipeline && validateBookingPipeline(data.pipeline)
    ? data.pipeline
    : null;

  return {
    pipeline,
    isLoading,
    isError: error || (data && !data.ok),
    error: error?.message || data?.error || null,
    mutate,
  };
}

