import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_MA_WINDOW, movingAverage } from '@/lib/analytics/forecast';
import { fetchPaidDailyHistoryForForecast } from '@/lib/analytics/forecast-bookings-server';

/**
 * Last moving-average of daily paid booking counts (same window as admin forecast). Used for predictive surge ratio.
 */
export async function fetchForecastBookingsScalarForSurge(
  supabase: SupabaseClient,
): Promise<number | null> {
  const res = await fetchPaidDailyHistoryForForecast(supabase, {
    historyDays: 60,
    serviceType: null,
  });
  if (!res || res.history.length === 0) return null;
  const series = res.history.map((h) => h.bookings);
  const ma = movingAverage(series, DEFAULT_MA_WINDOW);
  const last = ma[ma.length - 1];
  if (last == null || !Number.isFinite(last)) return null;
  return Math.round(last * 1000) / 1000;
}
