import { NextResponse } from 'next/server';
import { assertAdmin, createServiceClientForSchema } from '@/lib/supabase-server';
import { getMarketingStats } from '@/lib/marketing/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await assertAdmin();
  if (denied) return denied;

  try {
    const svc = createServiceClientForSchema();
    const stats = await getMarketingStats(svc);
    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
