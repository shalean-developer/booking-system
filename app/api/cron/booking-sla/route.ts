import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { runBookingSlaSweep } from '@/lib/sla/processBookingSla';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const q = new URL(req.url).searchParams.get('secret');
  return q === secret;
}

/**
 * GET /api/cron/booking-sla?secret=CRON_SECRET
 * Periodic SLA evaluation: sets `sla_status`, emails admin + customer (once each per booking).
 */
export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

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
