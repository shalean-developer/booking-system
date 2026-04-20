import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { isExcludedFromRevenueReporting } from '@/lib/booking-revenue-exclusion';
import {
  addCalendarDaysYmd,
  halfOpenCreatedAtRangeFromInclusiveYmd,
  inclusiveDayCount,
  queryParamToYmd,
  ymdFromInstantInBusinessTz,
  ymdTodayInBusinessTz,
} from '@/lib/admin-dashboard-business-range';
import { calculatePoints } from '@/lib/loyalty/points';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;
const MAX_PAGES = 500;

type BookingRow = {
  id: string;
  total_amount: number | null;
  payment_status: string | null;
  status: string | null;
  created_at: string | null;
  booking_date: string | null;
  service_type: string | null;
  surge_amount: number | null;
  surge_pricing_applied: boolean | null;
  duration_minutes: number | null;
  cleaner_id: string | null;
  assigned_cleaner_id: string | null;
  customer_id: string | null;
  price_snapshot: Record<string, unknown> | null;
  points_redeemed: number | null;
  frequency_discount: number | null;
};

function snapNum(s: Record<string, unknown> | null | undefined, key: string): number {
  if (!s || typeof s[key] !== 'number' || !Number.isFinite(s[key] as number)) return 0;
  return Number(s[key]);
}

function parseSnapshot(booking: BookingRow): {
  discountCents: number;
  surgeMultiplier: number | null;
  promoUsed: boolean;
} {
  const snap = booking.price_snapshot;
  if (!snap || typeof snap !== 'object') {
    return {
      discountCents: Math.max(0, Math.round(Number(booking.frequency_discount) || 0)),
      surgeMultiplier: null,
      promoUsed: false,
    };
  }
  const o = snap as Record<string, unknown>;
  const promoCents = snapNum(o, 'discount_amount');
  const freq = Math.max(0, Math.round(Number(booking.frequency_discount) || 0));
  const disc = freq + promoCents;
  let mult: number | null = null;
  if (typeof o.surge_multiplier === 'number' && Number.isFinite(o.surge_multiplier)) {
    mult = o.surge_multiplier;
  } else if (typeof o.unified_surge_multiplier === 'number') {
    mult = o.unified_surge_multiplier as number;
  }
  const code =
    (typeof o.discount_code === 'string' && o.discount_code.trim()) ||
    (typeof o.promo_code === 'string' && o.promo_code.trim());
  return { discountCents: disc, surgeMultiplier: mult, promoUsed: Boolean(code) };
}

async function fetchBookingsInRange(
  supabase: ReturnType<typeof createServiceClient>,
  gte: string,
  lt: string,
  serviceType: string | null,
): Promise<BookingRow[] | null> {
  const rows: BookingRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from('bookings')
      .select(
        'id, total_amount, payment_status, status, created_at, booking_date, service_type, surge_amount, surge_pricing_applied, duration_minutes, cleaner_id, assigned_cleaner_id, customer_id, price_snapshot, points_redeemed, frequency_discount',
      )
      .gte('created_at', gte)
      .lt('created_at', lt)
      .order('created_at', { ascending: true })
      .range(from, to);
    if (serviceType && serviceType !== 'all') {
      q = q.eq('service_type', serviceType);
    }
    const { data, error } = await q;
    if (error) {
      console.error('[analytics] bookings fetch', error);
      return null;
    }
    if (!data?.length) break;
    rows.push(...(data as BookingRow[]));
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

function paidOk(b: BookingRow): boolean {
  return String(b.payment_status || '').toLowerCase() === 'success' && !isExcludedFromRevenueReporting(b);
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('date_from');
    const dateToParam = searchParams.get('date_to');
    const serviceFilter = searchParams.get('service')?.trim() || null;

    const todayYmd = ymdTodayInBusinessTz();
    const defaultEnd = todayYmd;
    const defaultStart = addCalendarDaysYmd(todayYmd, -29);

    const startYmd = dateFromParam ? queryParamToYmd(dateFromParam) : defaultStart;
    const endYmd = dateToParam ? queryParamToYmd(dateToParam) : defaultEnd;

    const range = halfOpenCreatedAtRangeFromInclusiveYmd(startYmd, endYmd);
    const rangeDays = Math.max(1, inclusiveDayCount(startYmd, endYmd));

    const todayRange = halfOpenCreatedAtRangeFromInclusiveYmd(todayYmd, todayYmd);
    const weekStart = addCalendarDaysYmd(todayYmd, -6);
    const weekRange = halfOpenCreatedAtRangeFromInclusiveYmd(weekStart, todayYmd);
    const monthStart = addCalendarDaysYmd(todayYmd, -29);
    const monthRange = halfOpenCreatedAtRangeFromInclusiveYmd(monthStart, todayYmd);
    const activeCustRange = halfOpenCreatedAtRangeFromInclusiveYmd(
      addCalendarDaysYmd(todayYmd, -29),
      todayYmd,
    );

    const [
      bookingsRange,
      bookingsToday,
      bookingsWeek,
      bookingsMonth,
      cleanersRes,
      customersTotalRes,
      customersNewRes,
      bookingsForActiveCustomers,
    ] = await Promise.all([
      fetchBookingsInRange(supabase, range.gte, range.lt, serviceFilter),
      fetchBookingsInRange(supabase, todayRange.gte, todayRange.lt, serviceFilter),
      fetchBookingsInRange(supabase, weekRange.gte, weekRange.lt, serviceFilter),
      fetchBookingsInRange(supabase, monthRange.gte, monthRange.lt, serviceFilter),
      supabase.from('cleaners').select('id, name, is_active'),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      fetchBookingsInRange(supabase, activeCustRange.gte, activeCustRange.lt, serviceFilter),
    ]);

    if (bookingsRange === null) {
      return NextResponse.json({ ok: false, error: 'Failed to load bookings' }, { status: 500 });
    }

    const cleaners = (cleanersRes.data ?? []) as { id: string; name: string | null; is_active: boolean | null }[];
    const cleanerNameById = new Map(cleaners.map((c) => [c.id, c.name?.trim() || 'Cleaner']));
    const activeCleanersCount = cleaners.filter((c) => c.is_active !== false).length;

    const totalCustomers = customersTotalRes.count ?? 0;
    const newCustomers7d = customersNewRes.count ?? 0;

    const activeCustSet = new Set<string>();
    if (bookingsForActiveCustomers) {
      for (const b of bookingsForActiveCustomers) {
        if (paidOk(b) && b.customer_id) activeCustSet.add(b.customer_id);
      }
    }

    let totalRevenueCents = 0;
    let paidCountInRange = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let surgeRevenueCents = 0;
    const surgeMultSamples: number[] = [];
    let discountCentsTotal = 0;
    let promoBookingCount = 0;
    let pointsRedeemedTotal = 0;
    let pointsIssuedTotal = 0;

    const cleanerStats = new Map<
      string,
      { jobs: number; minutes: number; completed: number }
    >();

    const timeseriesMap = new Map<string, { date: string; revenueCents: number; bookings: number }>();

    for (const b of bookingsRange) {
      const st = String(b.status || '').toLowerCase();
      if (st === 'completed') completedCount += 1;
      else if (st === 'cancelled' || st === 'canceled') cancelledCount += 1;
      else pendingCount += 1;

      const created = b.created_at;
      if (created) {
        const d = ymdFromInstantInBusinessTz(created);
        const ex = timeseriesMap.get(d) || { date: d, revenueCents: 0, bookings: 0 };
        if (paidOk(b)) {
          ex.revenueCents += Math.round(Number(b.total_amount) || 0);
          ex.bookings += 1;
        }
        timeseriesMap.set(d, ex);
      }

      if (!paidOk(b)) continue;

      paidCountInRange += 1;
      totalRevenueCents += Math.round(Number(b.total_amount) || 0);

      const zar = (Number(b.total_amount) || 0) / 100;
      pointsIssuedTotal += calculatePoints(zar);
      pointsRedeemedTotal += Math.max(0, Math.floor(Number(b.points_redeemed) || 0));

      const surge = Math.max(0, Math.round(Number(b.surge_amount) || 0));
      surgeRevenueCents += surge;
      const { discountCents, surgeMultiplier, promoUsed } = parseSnapshot(b);
      discountCentsTotal += discountCents;
      if (promoUsed) promoBookingCount += 1;
      if (surgeMultiplier != null && surgeMultiplier > 1.0001) surgeMultSamples.push(surgeMultiplier);

      const cid = b.assigned_cleaner_id || b.cleaner_id;
      if (cid) {
        const cur = cleanerStats.get(cid) || { jobs: 0, minutes: 0, completed: 0 };
        cur.jobs += 1;
        cur.minutes += Math.max(0, Math.round(Number(b.duration_minutes) || 0));
        if (String(b.status || '').toLowerCase() === 'completed') cur.completed += 1;
        cleanerStats.set(cid, cur);
      }
    }

    const avgBookingValueCents =
      paidCountInRange > 0 ? Math.round(totalRevenueCents / paidCountInRange) : 0;

    const sumPaidCents = (rows: BookingRow[] | null) => {
      if (!rows) return 0;
      return rows.reduce((sum, b) => {
        if (!paidOk(b)) return sum;
        return sum + Math.round(Number(b.total_amount) || 0);
      }, 0);
    };

    const todayRevenueCents = sumPaidCents(bookingsToday);
    const weeklyRevenueCents = sumPaidCents(bookingsWeek);
    const monthlyRevenueCents = sumPaidCents(bookingsMonth);

    const avgSurgeMultiplier =
      surgeMultSamples.length > 0
        ? surgeMultSamples.reduce((a, x) => a + x, 0) / surgeMultSamples.length
        : 1;

    const avgDiscountPerBookingCents =
      paidCountInRange > 0 ? Math.round(discountCentsTotal / paidCountInRange) : 0;

    const totalBookingsInRange = bookingsRange.length;
    const avgDailyBookings = totalBookingsInRange / rangeDays;
    const demandRatio = activeCleanersCount > 0 ? avgDailyBookings / activeCleanersCount : avgDailyBookings;

    const filledSeries: { date: string; revenueCents: number; bookings: number }[] = [];
    let walk = startYmd;
    while (walk <= endYmd) {
      filledSeries.push(timeseriesMap.get(walk) ?? { date: walk, revenueCents: 0, bookings: 0 });
      walk = addCalendarDaysYmd(walk, 1);
    }
    const timeseries = filledSeries;

    const cleanerRows = Array.from(cleanerStats.entries())
      .map(([id, s]) => {
        const hours = s.minutes / 60;
        const utilizationPct =
          rangeDays > 0 ? Math.min(100, (hours / (9 * rangeDays)) * 100) : 0;
        const avgDurMin = s.jobs > 0 ? s.minutes / s.jobs : 0;
        return {
          id,
          name: cleanerNameById.get(id) ?? 'Unknown',
          jobsCompleted: s.completed,
          jobsPaid: s.jobs,
          hoursWorked: Math.round(hours * 100) / 100,
          utilizationPct: Math.round(utilizationPct * 10) / 10,
          avgJobDurationMinutes: Math.round(avgDurMin * 10) / 10,
        };
      })
      .sort((a, b) => b.hoursWorked - a.hoursWorked);

    const payload = {
      ok: true as const,
      meta: {
        dateFrom: startYmd,
        dateTo: endYmd,
        service: serviceFilter || 'all',
        rangeDays,
        generatedAt: new Date().toISOString(),
      },
      revenue: {
        totalCents: totalRevenueCents,
        totalZar: Math.round((totalRevenueCents / 100) * 100) / 100,
        todayCents: todayRevenueCents,
        todayZar: Math.round((todayRevenueCents / 100) * 100) / 100,
        weekCents: weeklyRevenueCents,
        weekZar: Math.round((weeklyRevenueCents / 100) * 100) / 100,
        monthCents: monthlyRevenueCents,
        monthZar: Math.round((monthlyRevenueCents / 100) * 100) / 100,
        avgBookingValueCents,
        avgBookingValueZar: Math.round((avgBookingValueCents / 100) * 100) / 100,
        paidBookingsInRange: paidCountInRange,
      },
      bookings: {
        total: totalBookingsInRange,
        completed: completedCount,
        pending: pendingCount,
        cancelled: cancelledCount,
      },
      customers: {
        total: totalCustomers,
        activeLast30Days: activeCustSet.size,
        newLast7Days: newCustomers7d,
      },
      cleaners: cleanerRows,
      demand: {
        avgDailyBookings: Math.round(avgDailyBookings * 100) / 100,
        activeCleaners: activeCleanersCount,
        demandRatio: Math.round(demandRatio * 1000) / 1000,
        rangeDays,
      },
      surge: {
        totalSurgeCents: surgeRevenueCents,
        totalSurgeZar: Math.round((surgeRevenueCents / 100) * 100) / 100,
        avgSurgeMultiplier: Math.round(avgSurgeMultiplier * 1000) / 1000,
        bookingsWithSurgeSample: surgeMultSamples.length,
      },
      discounts: {
        totalDiscountCents: discountCentsTotal,
        totalDiscountZar: Math.round((discountCentsTotal / 100) * 100) / 100,
        avgDiscountPerBookingCents,
        avgDiscountPerBookingZar: Math.round((avgDiscountPerBookingCents / 100) * 100) / 100,
        promoBookings: promoBookingCount,
      },
      loyalty: {
        pointsIssued: pointsIssuedTotal,
        pointsRedeemed: pointsRedeemedTotal,
      },
      timeseries,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[analytics]', {
        revenue: payload.revenue.totalZar,
        bookings: payload.bookings.total,
        customers: payload.customers.total,
      });
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (e) {
    console.error('[analytics]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}
