import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = await createClient();

    const patch: Record<string, unknown> = {};
    if ('rule_type' in body) patch.rule_type = body.rule_type ?? 'multiplier';
    if ('service_type' in body) patch.service_type = body.service_type ?? null;
    if ('area' in body) patch.area = body.area ?? null;
    if ('day_of_week' in body) {
      patch.day_of_week =
        body.day_of_week === '' || body.day_of_week === undefined
          ? null
          : Number(body.day_of_week);
    }
    if ('time_start' in body) {
      patch.time_start =
        body.time_start === '' || body.time_start === undefined ? null : Number(body.time_start);
    }
    if ('time_end' in body) {
      patch.time_end =
        body.time_end === '' || body.time_end === undefined ? null : Number(body.time_end);
    }
    if ('multiplier_override' in body) {
      patch.multiplier_override =
        body.multiplier_override === '' || body.multiplier_override === undefined
          ? null
          : Number(body.multiplier_override);
    }
    if ('min_price_zar' in body) {
      patch.min_price_zar =
        body.min_price_zar === '' || body.min_price_zar === undefined
          ? null
          : Number(body.min_price_zar);
    }
    if ('max_price_zar' in body) {
      patch.max_price_zar =
        body.max_price_zar === '' || body.max_price_zar === undefined
          ? null
          : Number(body.max_price_zar);
    }
    if ('dynamic_enabled' in body) patch.dynamic_enabled = Boolean(body.dynamic_enabled);
    if ('priority' in body) patch.priority = Number(body.priority) || 0;
    if ('is_active' in body) patch.is_active = Boolean(body.is_active);
    if ('starts_at' in body) {
      patch.starts_at =
        body.starts_at === '' || body.starts_at === undefined ? null : String(body.starts_at);
    }
    if ('ends_at' in body) {
      patch.ends_at = body.ends_at === '' || body.ends_at === undefined ? null : String(body.ends_at);
    }
    if ('notes' in body) patch.notes = body.notes ?? null;

    const { data, error } = await supabase
      .from('pricing_rules')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[pricing_rules] PATCH', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, rule: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }
    const supabase = await createClient();
    const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
    if (error) {
      console.error('[pricing_rules] DELETE', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
