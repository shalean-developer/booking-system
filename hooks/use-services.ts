'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';

type ServicesResponse = {
  ok: boolean;
  services?: unknown[];
  error?: string;
};

/**
 * Public services list for booking UI (same source as admin pricing metadata).
 */
export function useServices() {
  const { data, error, isLoading, mutate } = useSWR<ServicesResponse>('/api/dashboard/services', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  return {
    services: data?.ok ? data.services ?? [] : [],
    loading: isLoading,
    error: error?.message ?? data?.error ?? null,
    mutate,
  };
}
