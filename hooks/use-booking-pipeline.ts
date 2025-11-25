/**
 * Custom hook for fetching booking pipeline data
 */

import useSWR from 'swr';
import type { BookingPipeline } from '@/types/admin-dashboard';
import { validateBookingPipeline } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';

interface PipelineResponse {
  ok: boolean;
  pipeline?: BookingPipeline;
  error?: string;
}

export function useBookingPipeline() {
  const { data, error, isLoading, mutate } = useSWR<PipelineResponse>(
    '/api/admin/stats/booking-pipeline',
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

