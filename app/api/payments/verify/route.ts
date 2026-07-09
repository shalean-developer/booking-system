import { NextRequest, NextResponse } from 'next/server';
import { resolvePublicBaseUrlFromEnv } from '@/lib/public-base-url';

export const dynamic = 'force-dynamic';

/**
 * Paystack callback alias: forwards to the existing payment status page (same as `/api/paystack/initialize` callback).
 * Configure Paystack `callback_url` to this path for WhatsApp-initiated checkouts if desired.
 */
export async function GET(req: NextRequest) {
  const base = resolvePublicBaseUrlFromEnv();
  if (!base) {
    return NextResponse.json(
      { ok: false, error: 'Public site URL not configured (NEXT_PUBLIC_SITE_URL)' },
      { status: 500 },
    );
  }
  const u = new URL(req.url);
  const qs = u.searchParams.toString();
  const target = `${base}/payment/status${qs ? `?${qs}` : ''}`;
  return NextResponse.redirect(target, 302);
}
