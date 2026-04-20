import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';
import {
  addCalendarDaysYmd,
  ymdTodayInBusinessTz,
} from '@/lib/admin-dashboard-business-range';
import {
  alignActualVsMa,
  buildForecast,
  DEFAULT_FORECAST_HORIZON,
  DEFAULT_MA_WINDOW,
} from '@/lib/analytics/forecast';
import { fetchPaidDailyHistoryForForecast } from '@/lib/analytics/forecast-bookings-server';
import { fetchQuickCleanSettings } from '@/lib/quick-clean-settings';

export const dynamic = 'force-dynamic';

function clampHistoryDays(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : 60;
  if (!Number.isFinite(n)) return 60;
  return Math.min(60, Math.max(30, Math.floor(n)));
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const serviceFilter = searchParams.get('service')?.trim() || null;
    const historyDays = clampHistoryDays(searchParams.get('days'));

    const todayYmd = ymdTodayInBusinessTz();
    const startYmd = addCalendarDaysYmd(todayYmd, -(historyDays - 1));

    const [histRes, qc] = await Promise.all([
      fetchPaidDailyHistoryForForecast(supabase, {
        historyDays,
        serviceType: serviceFilter,
      }),
      fetchQuickCleanSettings(supabase),
    ]);

    if (histRes === null) {
      return NextResponse.json({ ok: false, error: 'Failed to load bookings' }, { status: 500 });
    }

    const { history, activeCleaners: activeCleanersCount } = histRes;

    const fc = buildForecast({
      history,
      activeCleaners: activeCleanersCount,
      horizon: DEFAULT_FORECAST_HORIZON,
      window: DEFAULT_MA_WINDOW,
    });

    const historyVsMovingAverage = alignActualVsMa(history, fc.maBookings, fc.maRevenueZar);

    const payload = {
      ok: true as const,
      meta: {
        historyFrom: startYmd,
        historyTo: todayYmd,
        historyDayCount: history.length,
        horizon: fc.meta.horizon,
        window: fc.meta.window,
        activeCleaners: fc.meta.activeCleaners,
        avgJobsPerCleanerPerDay: fc.meta.avgJobsPerCleanerPerDay,
        dailyCapacity: fc.meta.dailyCapacity,
        generatedAt: new Date().toISOString(),
        service: serviceFilter || 'all',
      },
      pricing: {
        enableForecastSurge: qc.enableForecastSurge,
      },
      forecastBookings: fc.forecastBookings,
      forecastRevenue: fc.forecastRevenueZar,
      forecastRevenueZar: fc.forecastRevenueZar,
      forecastDates: fc.forecastDates,
      demandAlerts: fc.demandAlerts,
      cleanerNeeds: fc.cleanerNeeds,
      historyVsMovingAverage,
      forecastMeta: fc.meta,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[forecast]', {
        bookings: history.map((h) => h.bookings),
        revenue: history.map((h) => h.revenueZar),
        predictions: {
          forecastBookings: fc.forecastBookings,
          forecastRevenue: fc.forecastRevenueZar,
        },
      });
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (e) {
    console.error('[forecast]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}
