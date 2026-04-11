'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';

type CleanersResponse = {
  ok: boolean;
  cleaners?: unknown[];
  total?: number;
  error?: string;
};

export function useAdminCleaners(limit = 100) {
  const url = `/api/admin/cleaners?limit=${limit}&offset=0`;
  const { data, error, isLoading, mutate } = useSWR<CleanersResponse>(url, fetcher, {
    revalidateOnFocus: true,
  });

  return {
    cleaners: data?.ok ? data.cleaners ?? [] : [],
    total: data?.total ?? 0,
    loading: isLoading,
    error: error?.message ?? data?.error ?? null,
    mutate,
  };
}
