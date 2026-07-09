import { NextRequest, NextResponse } from 'next/server';
import { createServiceClientForSchema } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeRedirectUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.href;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id')?.trim() || '';
  const target = url.searchParams.get('url') || '';

  const dest = safeRedirectUrl(target);
  if (!dest) {
    return NextResponse.redirect(new URL('/', req.url), 302);
  }

  if (UUID_RE.test(id)) {
    try {
      const svc = createServiceClientForSchema();
      await svc
        .from('email_logs')
        .update({ status: 'clicked', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('channel', 'email')
        .in('status', ['sent', 'opened']);
    } catch (e) {
      console.warn('[email/click]', e);
    }
  }

  return NextResponse.redirect(dest, 302);
}
