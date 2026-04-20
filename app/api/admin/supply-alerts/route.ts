import { NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';
import { ymdTodayInBusinessTz } from '@/lib/admin-dashboard-business-range';
import { fetchSurgeDemandCounts } from '@/lib/pricing/surge-demand-server';
import { fetchForecastBookingsScalarForSurge } from '@/lib/pricing/forecast-demand-server';
import { computeDemandRatio, detectSupplyShortage } from '@/lib/supply/activation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const todayYmd = ymdTodayInBusinessTz();
    const [counts, forecast, notifRes, respondedRes] = await Promise.all([
      fetchSurgeDemandCounts(supabase, { date: todayYmd }),
      fetchForecastBookingsScalarForSurge(supabase),
      supabase
        .from('cleaner_notifications')
        .select('*', { count: 'exact', head: true })
        .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('cleaner_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('responded', true)
        .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const effectiveBookings = Math.max(
      counts.active_bookings,
      Math.ceil(forecast ?? 0),
    );
    const demandRatio = computeDemandRatio(effectiveBookings, counts.available_cleaners);
    const shortage = detectSupplyShortage({
      bookings: effectiveBookings,
      availableCleaners: counts.available_cleaners,
    });

    const total7d = notifRes.count ?? 0;
    const responded7d = respondedRes.count ?? 0;
    const responseRate = total7d > 0 ? Math.round((responded7d / total7d) * 1000) / 1000 : 0;

    return NextResponse.json({
      ok: true as const,
      snapshot: {
        date: todayYmd,
        shortage,
        demandRatio,
        effectiveBookings,
        activeBookingsToday: counts.active_bookings,
        forecastBookings: forecast,
        availableCleaners: counts.available_cleaners,
      },
      alerts7d: {
        notificationsSent: total7d,
        responded: responded7d,
        responseRate,
      },
    });
  } catch (e) {
    console.error('[admin supply-alerts]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}
