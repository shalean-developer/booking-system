import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';
import { fetchAdminPendingCounts } from '@/lib/admin-pending-counts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createClient();
    const counts = await fetchAdminPendingCounts(supabase);

    return NextResponse.json({
      ok: true,
      ...counts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[API] /api/admin/pending-counts:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
