import { NextResponse } from 'next/server';
import { sendInvoiceEmail, validateResendConfig } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-email?to=you@example.com
 * Or set TEST_EMAIL_TO in .env.local (no query needed).
 */
export async function GET(req: Request) {
  console.log('🧪 Testing email...');

  const { searchParams } = new URL(req.url);
  const to =
    searchParams.get('to')?.trim() ||
    process.env.TEST_EMAIL_TO?.trim() ||
    '';

  if (!to) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Pass ?to=your@email.com or set TEST_EMAIL_TO in .env.local',
      },
      { status: 400 },
    );
  }

  const cfg = validateResendConfig();
  if (!cfg.ok) {
    return NextResponse.json({ ok: false, error: cfg.error }, { status: 503 });
  }

  try {
    await sendInvoiceEmail(to);
    return NextResponse.json({ success: true, ok: true, to });
  } catch (e) {
    console.error('[api/test-email]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
