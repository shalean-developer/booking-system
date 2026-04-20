import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates `?secret=` against `process.env.CRON_SECRET` for external cron GET requests.
 * Returns a 401 response if missing or mismatch; returns null when authorized.
 */
export function requireCronSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const got = new URL(req.url).searchParams.get('secret');
  if (got === expected) return null;
  const auth = req.headers.get('authorization');
  const bearer =
    auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  if (bearer === expected) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
