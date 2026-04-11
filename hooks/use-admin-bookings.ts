'use client';

import useSWR from 'swr';
import { useEffect } from 'react';
import { fetcher } from '@/lib/swr-config';
import { supabase } from '@/lib/supabase-client';

type BookingsResponse = {
  ok: boolean;
  bookings?: unknown[];
  total?: number;
  error?: string;
};

export function useAdminBookings(limit = 200) {
  const url = `/api/admin/bookings?limit=${limit}&offset=0`;
  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(url, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          mutate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  return {
    bookings: data?.ok ? data.bookings ?? [] : [],
    total: data?.total ?? 0,
    loading: isLoading,
    error: error?.message ?? data?.error ?? null,
    mutate,
  };
}
