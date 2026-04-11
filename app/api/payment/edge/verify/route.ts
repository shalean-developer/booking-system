import { NextResponse } from 'next/server';
import { edgeVerifyPayment } from '@/lib/payment-edge';

export const dynamic = 'force-dynamic';

/**
 * Server proxy to Supabase Edge Function `verify-payment`.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
    const booking_id = typeof body.booking_id === 'string' ? body.booking_id.trim() : '';

    if (!reference || !booking_id) {
      return NextResponse.json({ ok: false, error: 'reference and booking_id are required' }, { status: 400 });
    }

    const result = await edgeVerifyPayment({ reference, booking_id });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error('[payment/edge/verify]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Verification failed' },
      { status: 500 },
    );
  }
}
