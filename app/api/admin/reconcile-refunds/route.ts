import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin, createServiceClient } from '@/lib/supabase-server';
import { reconcilePaystackRefundsVsLocalBookings } from '@/lib/reconcile-refunds';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reconcile-refunds?limit=80
 * Compares Paystack transaction status vs local booking payment_status (refund drift).
 */
export async function GET(req: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  try {
    const supabase = createServiceClient();
    const result = await reconcilePaystackRefundsVsLocalBookings(supabase, {
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'reconcile failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
