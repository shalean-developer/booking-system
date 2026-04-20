import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';
import { ymdTodayInBusinessTz } from '@/lib/admin-dashboard-business-range';
import { fetchSupplyStatusRows } from '@/lib/supply/supply-status-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/supply/status?date=YYYY-MM-DD (optional; defaults to today in business TZ)
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  const dateParam = req.nextUrl.searchParams.get('date');
  const supabase = createServiceClient();

  let dateYmd: string;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    dateYmd = dateParam;
  } else {
    dateYmd = ymdTodayInBusinessTz();
  }

  const rows = await fetchSupplyStatusRows(supabase, dateYmd);
  return NextResponse.json({ ok: true, date: dateYmd, rows });
}
