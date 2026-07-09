import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type ProfitRow = {
  id: string;
  created_at: string | null;
  booking_date: string | null;
  paystack_verified_at: string | null;
  service_type: string | null;
  revenue_zar: number | null;
  cleaner_cost_zar: number | null;
  profit_zar: number | null;
  margin_percent: number | null;
};

function dayKey(iso: string | null | undefined): string {
  if (!iso || typeof iso !== 'string') return '';
  return iso.length >= 10 ? iso.slice(0, 10) : '';
}

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Paid bookings with locked snapshot P&L (revenue_zar populated at payment).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from')?.trim() || null;
    const to = searchParams.get('to')?.trim() || null;

    let q = supabase
      .from('bookings')
      .select(
        'id, created_at, booking_date, paystack_verified_at, service_type, revenue_zar, cleaner_cost_zar, profit_zar, margin_percent',
      )
      .eq('status', 'paid')
      .not('revenue_zar', 'is', null)
      .order('created_at', { ascending: false });

    if (from) {
      q = q.gte('created_at', `${from}T00:00:00.000Z`);
    }
    if (to) {
      q = q.lte('created_at', `${to}T23:59:59.999Z`);
    }

    const { data, error } = await q.limit(5000);

    if (error) {
      console.error('[admin/analytics/profit]', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as ProfitRow[];

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    for (const x of rows) {
      totalRevenue += num(x.revenue_zar);
      totalCost += num(x.cleaner_cost_zar);
      totalProfit += num(x.profit_zar);
    }

    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const dailyMap = new Map<string, { revenue_zar: number; profit_zar: number }>();
    for (const b of rows) {
      const dk =
        dayKey(b.paystack_verified_at) ||
        dayKey(b.created_at) ||
        (b.booking_date && b.booking_date.length >= 10 ? b.booking_date.slice(0, 10) : '');
      if (!dk) continue;
      const cur = dailyMap.get(dk) ?? { revenue_zar: 0, profit_zar: 0 };
      cur.revenue_zar += num(b.revenue_zar);
      cur.profit_zar += num(b.profit_zar);
      dailyMap.set(dk, cur);
    }

    const chartData = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        revenue_zar: v.revenue_zar,
        profit_zar: v.profit_zar,
      }));

    return NextResponse.json({
      ok: true,
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin,
      bookings: rows,
      chartData,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
