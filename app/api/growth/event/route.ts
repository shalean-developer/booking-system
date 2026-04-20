import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import type { GrowthEventPayload } from '@/lib/growth/growthEngine';

export const runtime = 'nodejs';

/**
 * Ingest growth / funnel events (ads, SEO, referrals).
 * Prefers service role when configured; otherwise no-ops in dev.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GrowthEventPayload & { event?: string };
    const eventType = typeof body.event === 'string' ? body.event.trim() : '';
    if (!eventType || eventType.length > 120) {
      return NextResponse.json({ ok: false, error: 'Invalid event' }, { status: 400 });
    }

    const { event: _e, ...rest } = body;
    const properties = { ...rest } as Record<string, unknown>;

    let supabase;
    try {
      supabase = createServiceClient();
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[growth/event]', eventType, properties);
      }
      return NextResponse.json({ ok: true, skipped: true });
    }
    const { error } = await supabase.from('growth_events').insert({
      event_type: eventType,
      properties,
    });

    if (error) {
      console.warn('[growth/event] insert failed', error.message);
      return NextResponse.json({ ok: false, error: 'Store failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }
}
