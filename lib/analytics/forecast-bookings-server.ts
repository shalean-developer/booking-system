import type { SupabaseClient } from '@supabase/supabase-js';
import { isExcludedFromRevenueReporting } from '@/lib/booking-revenue-exclusion';
import {
  addCalendarDaysYmd,
  halfOpenCreatedAtRangeFromInclusiveYmd,
  ymdFromInstantInBusinessTz,
  ymdTodayInBusinessTz,
} from '@/lib/admin-dashboard-business-range';
import type { DailyPoint } from '@/lib/analytics/forecast';

const PAGE_SIZE = 1000;
const MAX_PAGES = 500;

export type ForecastBookingRow = {
  id: string;
  total_amount: number | null;
  payment_status: string | null;
  status: string | null;
  created_at: string | null;
  booking_date: string | null;
  service_type: string | null;
};

export async function fetchBookingsInRangeForForecast(
  supabase: SupabaseClient,
  gte: string,
  lt: string,
  serviceType: string | null,
): Promise<ForecastBookingRow[] | null> {
  const rows: ForecastBookingRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from('bookings')
      .select('id, total_amount, payment_status, status, created_at, booking_date, service_type')
      .gte('created_at', gte)
      .lt('created_at', lt)
      .order('created_at', { ascending: true })
      .range(from, to);
    if (serviceType && serviceType !== 'all') {
      q = q.eq('service_type', serviceType);
    }
    const { data, error } = await q;
    if (error) {
      console.error('[forecast-bookings]', error);
      return null;
    }
    if (!data?.length) break;
    rows.push(...(data as ForecastBookingRow[]));
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

function paidOk(b: ForecastBookingRow): boolean {
  return String(b.payment_status || '').toLowerCase() === 'success' && !isExcludedFromRevenueReporting(b);
}

export type PaidDailyHistoryResult = {
  history: DailyPoint[];
  activeCleaners: number;
};

/**
 * Paid bookings per calendar day (by created_at in business TZ) for forecast / surge.
 */
export async function fetchPaidDailyHistoryForForecast(
  supabase: SupabaseClient,
  opts: { historyDays: number; serviceType: string | null },
): Promise<PaidDailyHistoryResult | null> {
  const historyDays = Math.min(60, Math.max(30, Math.floor(opts.historyDays)));
  const todayYmd = ymdTodayInBusinessTz();
  const startYmd = addCalendarDaysYmd(todayYmd, -(historyDays - 1));
  const range = halfOpenCreatedAtRangeFromInclusiveYmd(startYmd, todayYmd);

  const [bookingsRows, cleanersRes] = await Promise.all([
    fetchBookingsInRangeForForecast(supabase, range.gte, range.lt, opts.serviceType),
    supabase.from('cleaners').select('id, is_active'),
  ]);

  if (bookingsRows === null) return null;

  const cleaners = (cleanersRes.data ?? []) as { id: string; is_active: boolean | null }[];
  const activeCleaners = cleaners.filter((c) => c.is_active !== false).length;

  const byDay = new Map<string, { bookings: number; revenueZar: number }>();
  for (const b of bookingsRows) {
    const created = b.created_at;
    if (!created) continue;
    if (!paidOk(b)) continue;
    const d = ymdFromInstantInBusinessTz(created);
    const cur = byDay.get(d) ?? { bookings: 0, revenueZar: 0 };
    cur.bookings += 1;
    cur.revenueZar += (Number(b.total_amount) || 0) / 100;
    byDay.set(d, cur);
  }

  const history: DailyPoint[] = [];
  let walk = startYmd;
  while (walk <= todayYmd) {
    const row = byDay.get(walk);
    history.push({
      date: walk,
      bookings: row?.bookings ?? 0,
      revenueZar: row ? Math.round(row.revenueZar * 100) / 100 : 0,
    });
    walk = addCalendarDaysYmd(walk, 1);
  }

  return { history, activeCleaners };
}
