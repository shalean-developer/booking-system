import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/supabase-server';

/**
 * Debug / test API routes: disabled in production; in development require admin or DEBUG_API_SECRET.
 */

function getDebugSecret(): string | undefined {
  return process.env.DEBUG_API_SECRET?.trim();
}

function secretMatches(req: Request, expected: string): boolean {
  const url = new URL(req.url);
  const q = url.searchParams.get('secret');
  if (q === expected) return true;
  const header = req.headers.get('x-debug-api-secret');
  if (header === expected) return true;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ') && auth.slice(7) === expected) return true;
  return false;
}

/**
 * @returns `NextResponse` to return immediately, or `null` if the request may proceed.
 */
export async function authorizeDebugApiRequest(req: Request): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  if (await isAdmin()) {
    return null;
  }

  const expected = getDebugSecret();
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  if (secretMatches(req, expected)) {
    return null;
  }

  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}
