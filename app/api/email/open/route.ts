import { NextRequest, NextResponse } from 'next/server';
import { createServiceClientForSchema } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/** 1×1 transparent GIF */
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')?.trim() || '';
  if (!UUID_RE.test(id)) {
    return new NextResponse(PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    });
  }

  try {
    const svc = createServiceClientForSchema();
    await svc
      .from('email_logs')
      .update({ status: 'opened', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('channel', 'email')
      .in('status', ['sent']);
  } catch (e) {
    console.warn('[email/open]', e);
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  });
}
