import { NextResponse } from 'next/server';
import { edgeInitializePayment } from '@/lib/payment-edge';

export const dynamic = 'force-dynamic';

/**
 * Server proxy to Supabase Edge Function `initialize-payment`.
 * Accepts only booking_id; amount and email come from the database.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const booking_id = typeof body.booking_id === 'string' ? body.booking_id.trim() : '';

    if (!booking_id) {
      return NextResponse.json({ ok: false, error: 'booking_id is required' }, { status: 400 });
    }

    const result = await edgeInitializePayment({ booking_id });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error('[payment/edge/initialize]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Initialize failed' },
      { status: 500 },
    );
  }
}
