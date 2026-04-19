import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { isExcludedFromRevenueReporting } from '@/lib/booking-revenue-exclusion';
import {
  defaultRollingBusinessRanges,
  halfOpenCreatedAtRangeFromInclusiveYmd,
  queryParamToYmd,
  ymdFromInstantInBusinessTz,
} from '@/lib/admin-dashboard-business-range';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;
const MAX_PAGES = 500;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[API] /api/admin/stats/chart - Request started');

  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let startYmd: string;
    let endYmd: string;
    if (dateFrom && dateTo) {
      startYmd = queryParamToYmd(dateFrom);
      endYmd = queryParamToYmd(dateTo);
    } else {
      const r = defaultRollingBusinessRanges(30);
      startYmd = r.currentStartYmd;
      endYmd = r.currentEndYmd;
    }

    const { gte, lt } = halfOpenCreatedAtRangeFromInclusiveYmd(startYmd, endYmd);

    const bookings: {
      total_amount: number | null;
      status: string | null;
      payment_status?: string | null;
      created_at: string | null;
    }[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data: batch, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, total_amount, booking_date, status, payment_status, created_at')
        .eq('payment_status', 'success')
        .gte('created_at', gte)
        .lt('created_at', lt)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (bookingsError) {
        console.error('Error fetching bookings for chart:', bookingsError);
        return NextResponse.json({ ok: true, data: [] });
      }
      if (!batch?.length) break;
      bookings.push(...(batch as typeof bookings));
      if (batch.length < PAGE_SIZE) break;
    }

    const chartDataMap = new Map<string, { date: string; revenue: number; bookings: number }>();

    bookings.forEach((booking) => {
      if (
        isExcludedFromRevenueReporting({
          payment_status: booking.payment_status,
          status: booking.status,
        })
      ) {
        return;
      }
      const created = booking.created_at;
      if (!created) return;
      const date = ymdFromInstantInBusinessTz(created);

      const existing = chartDataMap.get(date) || { date, revenue: 0, bookings: 0 };
      existing.revenue += booking.total_amount || 0;
      existing.bookings += 1;
      chartDataMap.set(date, existing);
    });

    const chartData = Array.from(chartDataMap.values()).map((item) => ({
      date: item.date,
      revenue: item.revenue,
      bookings: item.bookings,
    }));

    const totalDuration = Date.now() - startTime;
    console.log(`[API] /api/admin/stats/chart - Success (${totalDuration}ms), data points: ${chartData.length}`);

    return NextResponse.json({
      ok: true,
      data: chartData,
    });
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[API] /api/admin/stats/chart - Error after ${totalDuration}ms:`, {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json({
      ok: true,
      data: [],
    });
  }
}
