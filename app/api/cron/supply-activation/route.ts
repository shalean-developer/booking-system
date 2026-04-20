import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-secret';
import { createServiceClient } from '@/lib/supabase-server';
import { runSupplyActivationCheck } from '@/lib/supply/run-check';

export const dynamic = 'force-dynamic';

/**
 * Every 30m: evaluate demand vs supply and notify cleaners (throttled).
 * Secure with CRON_SECRET (query or Authorization: Bearer).
 */
export async function GET(req: NextRequest) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const supabase = createServiceClient();
    const result = await runSupplyActivationCheck(supabase);
    return NextResponse.json({
      ok: true,
      shortage: result.shortage,
      demandRatio: result.demandRatio,
      notified: result.notified,
      areaLabels: result.areaLabels,
    });
  } catch (e) {
    console.error('[supply-activation cron]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}
