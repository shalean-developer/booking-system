import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { isExcludedFromRevenueReporting } from '@/lib/booking-revenue-exclusion';
import {
  defaultRollingBusinessRanges,
  halfOpenCreatedAtRangeFromInclusiveYmd,
  previousBusinessRangeFromCurrent,
  queryParamToYmd,
} from '@/lib/admin-dashboard-business-range';
import { logAdminRevenueExclusionDeltaDev } from '@/lib/admin-dashboard-revenue-validation';
import { fetchAdminPendingCounts } from '@/lib/admin-pending-counts';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;
const MAX_PAGES = 500;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[API] /api/admin/stats - Request started');

  try {
    const adminCheckStart = Date.now();
    const isAdminUser = await isAdmin();
    console.log(`[API] Admin check completed in ${Date.now() - adminCheckStart}ms, result: ${isAdminUser}`);

    if (!isAdminUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabaseStart = Date.now();
    const supabase = await createClient();
    console.log(`[API] Supabase client created in ${Date.now() - supabaseStart}ms`);

    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('date_from');
    const dateToParam = searchParams.get('date_to');

    let currentStartYmd: string;
    let currentEndYmd: string;
    let previousStartYmd: string;
    let previousEndYmd: string;

    if (dateFromParam && dateToParam) {
      currentStartYmd = queryParamToYmd(dateFromParam);
      currentEndYmd = queryParamToYmd(dateToParam);
      const prev = previousBusinessRangeFromCurrent(currentStartYmd, currentEndYmd);
      previousStartYmd = prev.previousStartYmd;
      previousEndYmd = prev.previousEndYmd;
    } else {
      const r = defaultRollingBusinessRanges(30);
      currentStartYmd = r.currentStartYmd;
      currentEndYmd = r.currentEndYmd;
      previousStartYmd = r.previousStartYmd;
      previousEndYmd = r.previousEndYmd;
    }

    const currentRange = halfOpenCreatedAtRangeFromInclusiveYmd(currentStartYmd, currentEndYmd);
    const previousRange = halfOpenCreatedAtRangeFromInclusiveYmd(previousStartYmd, previousEndYmd);

    const selectCols = 'id, total_amount, customer_id, status, payment_status, created_at';

    async function fetchPaidInRange(gte: string, lt: string) {
      const rows: {
        id: string;
        total_amount: number | null;
        customer_id: string | null;
        status: string | null;
        payment_status: string | null;
        created_at: string | null;
      }[] = [];

      for (let page = 0; page < MAX_PAGES; page++) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await supabase
          .from('bookings')
          .select(selectCols)
          .eq('payment_status', 'success')
          .gte('created_at', gte)
          .lt('created_at', lt)
          .order('id', { ascending: true })
          .range(from, to);

        if (error) {
          console.error('Error fetching bookings for admin stats:', error);
          return null;
        }
        if (!data?.length) break;
        rows.push(...(data as typeof rows));
        if (data.length < PAGE_SIZE) break;
      }
      return rows;
    }

    const [currentBookings, previousBookings] = await Promise.all([
      fetchPaidInRange(currentRange.gte, currentRange.lt),
      fetchPaidInRange(previousRange.gte, previousRange.lt),
    ]);

    if (currentBookings === null || previousBookings === null) {
      return NextResponse.json({ ok: false, error: 'Failed to load bookings' }, { status: 500 });
    }

    const includedCurrent = currentBookings.filter(
      (b) =>
        !isExcludedFromRevenueReporting(b) && b.total_amount != null && Number(b.total_amount) > 0,
    );
    const includedPrevious = previousBookings.filter(
      (b) =>
        !isExcludedFromRevenueReporting(b) && b.total_amount != null && Number(b.total_amount) > 0,
    );

    const currentRevenue = includedCurrent.reduce((sum, b) => sum + Math.round(Number(b.total_amount) || 0), 0);
    const previousRevenue = includedPrevious.reduce((sum, b) => sum + Math.round(Number(b.total_amount) || 0), 0);

    logAdminRevenueExclusionDeltaDev('currentPeriod', currentBookings, currentRevenue);
    logAdminRevenueExclusionDeltaDev('previousPeriod', previousBookings, previousRevenue);

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous <= 0) return 0;
      const growth = ((current - previous) / previous) * 100;
      return Math.min(Math.max(growth, -9999), 9999);
    };

    const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);

    const currentBookingsCount = includedCurrent.length;
    const previousBookingsCount = includedPrevious.length;
    const bookingsGrowth = calculateGrowth(currentBookingsCount, previousBookingsCount);

    const avgBookingValue =
      currentBookingsCount > 0 ? Math.round(currentRevenue / currentBookingsCount) : 0;

    const prevAvgBookingValue =
      previousBookingsCount > 0 ? Math.round(previousRevenue / previousBookingsCount) : 0;

    const avgValueGrowth = calculateGrowth(avgBookingValue, prevAvgBookingValue);

    const uniqueCustomers = new Set(
      includedCurrent.map((b) => b.customer_id).filter((id): id is string => Boolean(id)),
    );
    const activeCustomers = uniqueCustomers.size;

    const prevUniqueCustomers = new Set(
      includedPrevious.map((b) => b.customer_id).filter((id): id is string => Boolean(id)),
    );
    const prevActiveCustomers = prevUniqueCustomers.size;
    const customersGrowth = calculateGrowth(activeCustomers, prevActiveCustomers);

    const { pendingQuotes, pendingApplications, pendingBookings } = await fetchAdminPendingCounts(supabase);

    const totalDuration = Date.now() - startTime;
    console.log(`[API] /api/admin/stats - Success (${totalDuration}ms)`);

    return NextResponse.json({
      ok: true,
      stats: {
        totalRevenue: currentRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalBookings: currentBookingsCount,
        bookingsGrowth: Math.round(bookingsGrowth * 100) / 100,
        activeCustomers,
        customersGrowth: Math.round(customersGrowth * 100) / 100,
        avgBookingValue,
        avgValueGrowth: Math.round(avgValueGrowth * 100) / 100,
        pendingQuotes,
        pendingApplications,
        pendingBookings,
      },
    });
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[API] /api/admin/stats - Error after ${totalDuration}ms:`, {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
