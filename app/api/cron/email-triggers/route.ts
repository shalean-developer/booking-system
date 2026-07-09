import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-secret';
import { createServiceClientForSchema } from '@/lib/supabase-server';
import { runMarketingEmailTriggers } from '@/lib/email/marketing-triggers';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const svc = createServiceClientForSchema();
    console.log('[cron] email-triggers start');
    const result = await runMarketingEmailTriggers(svc);
    console.log('[cron] email-triggers done', result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[cron] email-triggers', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
