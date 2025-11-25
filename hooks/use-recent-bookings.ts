/**
 * Custom hook for fetching recent bookings
 */

import useSWR from 'swr';
import type { RecentBooking } from '@/types/admin-dashboard';
import { validateRecentBookings } from '@/lib/utils/validation';
import { fetcher } from '@/lib/swr-config';

interface BookingsResponse {
  ok: boolean;
  bookings?: RecentBooking[];
  total?: number;
  totalPages?: number;
  error?: string;
}

export function useRecentBookings(limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(
    `/api/admin/bookings?limit=${limit}`,
    fetcher,
    {
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  );

  const recentBookings = data?.ok && data.bookings && validateRecentBookings(data.bookings)
    ? data.bookings
    : [];

  return {
    recentBookings,
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    isLoading,
    isError: error || (data && !data.ok),
    error: error?.message || data?.error || null,
    mutate,
  };
}

