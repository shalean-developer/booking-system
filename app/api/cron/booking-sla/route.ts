import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-secret';
import { createServiceClient } from '@/lib/supabase-server';
import { runBookingSlaSweep } from '@/lib/sla/processBookingSla';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/booking-sla?secret=CRON_SECRET
 * Periodic SLA evaluation: sets `sla_status`, emails admin + customer (once each per booking).
 */
export async function GET(req: NextRequest) {
  try {
    const unauthorized = requireCronSecret(req);
    if (unauthorized) return unauthorized;

    const supabase = createServiceClient();
    const result = await runBookingSlaSweep(supabase);

    console.log('[booking-sla cron]', result);

    return NextResponse.json({
      ok: true,
      scanned: result.scanned,
      inWarning: result.inWarning,
      cleared: result.cleared,
      reassigned: result.reassigned,
      escalated: result.escalated,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[booking-sla cron]', e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
