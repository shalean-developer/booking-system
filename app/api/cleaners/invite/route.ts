import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Stub endpoint for supply-side automation when no cleaner matches a slot.
 * Replace body handling with queue worker / CRM / WhatsApp broadcast in production.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const area = typeof body.area === 'string' ? body.area.trim() : '';
    const time = typeof body.time === 'string' ? body.time.trim() : '';
    console.log('[cleaners/invite] stub', { area, time });
    return NextResponse.json({ ok: true, received: { area, time } });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bad request';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
