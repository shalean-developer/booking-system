import { NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Growth funnel + CAC inputs. Ad spend is manual via `GROWTH_AD_SPEND_ZAR_30D` until Ads API is wired.
 */
export async function GET() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    let supabase: ReturnType<typeof createServiceClient>;
    try {
      supabase = createServiceClient();
    } catch {
      return NextResponse.json({
        ok: true,
        rangeDays: 30,
        metrics: null,
        note: 'SUPABASE_SERVICE_ROLE_KEY missing — growth DB metrics unavailable.',
      });
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    async function countType(eventType: string) {
      const { count, error } = await supabase
        .from('growth_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', eventType)
        .gte('created_at', sinceIso);
      if (error) return 0;
      return count ?? 0;
    }

    const pageViews = await countType('page_view');
    const bookingStarted = await countType('booking_started');
    const bookingCompleted = await countType('booking_completed');
    const seoPageViews = await countType('seo_page_view');
    const referralClicks = await countType('referral_click');

    const adSpendZar = Math.max(0, Number(process.env.GROWTH_AD_SPEND_ZAR_30D ?? 0) || 0);
    const estimatedCacZar =
      adSpendZar > 0 && bookingCompleted > 0 ? Math.round((adSpendZar / bookingCompleted) * 100) / 100 : null;

    return NextResponse.json({
      ok: true,
      rangeDays: 30,
      metrics: {
        pageViews,
        bookingStarted,
        bookingCompleted,
        seoPageViews,
        referralClicks,
        bookingConversionRate: pageViews > 0 ? Math.round((bookingCompleted / pageViews) * 10000) / 10000 : null,
        funnelBookingStartRate: pageViews > 0 ? Math.round((bookingStarted / pageViews) * 10000) / 10000 : null,
        referralClickThroughRate: pageViews > 0 ? Math.round((referralClicks / pageViews) * 10000) / 10000 : null,
        adSpendZar30d: adSpendZar,
        estimatedCacZar,
      },
    });
  } catch (e) {
    console.error('[admin/growth/metrics]', e);
    return NextResponse.json({ ok: false, error: 'Failed to load metrics' }, { status: 500 });
  }
}
