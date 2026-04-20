import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[pricing_rules] GET', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, rules: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = await createClient();

    const row = {
      rule_type: (body.rule_type as string | null) ?? 'multiplier',
      service_type: (body.service_type as string | null) ?? null,
      area: (body.area as string | null) ?? null,
      day_of_week:
        body.day_of_week === '' || body.day_of_week === undefined
          ? null
          : Number(body.day_of_week),
      time_start:
        body.time_start === '' || body.time_start === undefined
          ? null
          : Number(body.time_start),
      time_end:
        body.time_end === '' || body.time_end === undefined ? null : Number(body.time_end),
      multiplier_override:
        body.multiplier_override === '' || body.multiplier_override === undefined
          ? null
          : Number(body.multiplier_override),
      min_price_zar:
        body.min_price_zar === '' || body.min_price_zar === undefined
          ? null
          : Number(body.min_price_zar),
      max_price_zar:
        body.max_price_zar === '' || body.max_price_zar === undefined
          ? null
          : Number(body.max_price_zar),
      dynamic_enabled: body.dynamic_enabled !== false,
      priority: Number(body.priority) || 0,
      is_active: body.is_active !== false,
      starts_at:
        body.starts_at === '' || body.starts_at === undefined || body.starts_at === null
          ? null
          : String(body.starts_at),
      ends_at:
        body.ends_at === '' || body.ends_at === undefined || body.ends_at === null
          ? null
          : String(body.ends_at),
      notes: (body.notes as string | null) ?? null,
    };

    const { data, error } = await supabase.from('pricing_rules').insert(row).select('*').single();

    if (error) {
      console.error('[pricing_rules] POST', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, rule: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
