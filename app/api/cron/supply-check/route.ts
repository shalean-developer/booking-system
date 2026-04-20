import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-secret';
import { createServiceClient } from '@/lib/supabase-server';
import { runSupplyCheckJob } from '@/lib/cron/supply-check';

export const dynamic = 'force-dynamic';

/**
 * Every 10–15m (see Vercel cron): activation + per-area slot shortage → invites (throttled).
 * GET /api/cron/supply-check?secret=CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const supabase = createServiceClient();
    const result = await runSupplyCheckJob(supabase);
    return NextResponse.json({
      ok: true,
      date: result.date,
      activation: result.activation,
      slotEvaluations: result.slotEvaluations,
      invitesFromSlots: result.invitesFromSlots,
      samples: result.samples,
    });
  } catch (e) {
    console.error('[supply-check cron]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
