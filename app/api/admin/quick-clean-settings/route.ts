import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';
import { fetchQuickCleanSettings, DEFAULT_QUICK_CLEAN_SETTINGS } from '@/lib/quick-clean-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }
    const s = await fetchQuickCleanSettings(createServiceClient());
    return NextResponse.json({ ok: true as const, settings: s });
  } catch (e) {
    console.error('[quick-clean-settings]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }
    const body = (await request.json()) as { enableForecastSurge?: boolean };
    if (typeof body.enableForecastSurge !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'enableForecastSurge (boolean) is required' },
        { status: 400 },
      );
    }
    const supabase = createServiceClient();
    const { data: row, error: fetchErr } = await supabase
      .from('quick_clean_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (fetchErr) {
      console.error('[quick-clean-settings]', fetchErr);
      return NextResponse.json({ ok: false, error: 'Failed to load settings' }, { status: 500 });
    }
    const id = (row as { id?: number } | null)?.id;
    if (id == null) {
      const { error: insErr } = await supabase.from('quick_clean_settings').insert({
        hourly_rate_zar: DEFAULT_QUICK_CLEAN_SETTINGS.hourlyRateZar,
        extra_time_hours: DEFAULT_QUICK_CLEAN_SETTINGS.extraTimeHours,
        max_total_hours: DEFAULT_QUICK_CLEAN_SETTINGS.maxTotalHours,
        price_rounding: DEFAULT_QUICK_CLEAN_SETTINGS.priceRounding,
        min_callout_price: DEFAULT_QUICK_CLEAN_SETTINGS.minCalloutPrice,
        enable_forecast_surge: body.enableForecastSurge,
      });
      if (insErr) {
        console.error('[quick-clean-settings] insert', insErr);
        return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
      }
    } else {
      const { error: upErr } = await supabase
        .from('quick_clean_settings')
        .update({ enable_forecast_surge: body.enableForecastSurge, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (upErr) {
        console.error('[quick-clean-settings] update', upErr);
        return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
      }
    }
    const settings = await fetchQuickCleanSettings(supabase);
    return NextResponse.json({ ok: true as const, settings });
  } catch (e) {
    console.error('[quick-clean-settings]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}
