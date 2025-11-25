/**
 * Custom hook for fetching service breakdown data
 */

import useSWR from 'swr';
import type { ServiceBreakdownItem } from '@/types/admin-dashboard';
import { validateServiceBreakdown } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';

interface ServiceBreakdownResponse {
  ok: boolean;
  data?: ServiceBreakdownItem[];
  error?: string;
}

export function useServiceBreakdown() {
  const { data, error, isLoading, mutate } = useSWR<ServiceBreakdownResponse>(
    '/api/admin/stats/service-breakdown',
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

