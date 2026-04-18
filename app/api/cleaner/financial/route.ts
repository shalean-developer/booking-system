import { NextResponse } from 'next/server';
import { getCleanerSession, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClientForSchema } from '@/lib/supabase-server';
import { getCleanerFinancialData } from '@/lib/cleaner-financial';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClientForSchema();
    const cleanerId = cleanerIdToUuid(session.id);
    const data = await getCleanerFinancialData(supabase, cleanerId);

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error('[cleaner/financial]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}
