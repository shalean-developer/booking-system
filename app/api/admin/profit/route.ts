import { NextResponse } from 'next/server';
import { assertAdmin, createClient, createServiceClient } from '@/lib/supabase-server';
import { fetchProfitDashboardData } from '@/lib/admin/profit-dashboard-data';
import { profitDashboardToApiJson } from '@/lib/admin/profit-api-payload';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/profit
 * Query: from, to (YYYY-MM-DD), service, cleaner (UUID), mode=realized|projected (default realized)
 * Returns realized + projected snapshots, losses, net profit, growth (when date range set), alerts, cleaner performance.
 * Amounts are integer cents; profitMargin is 0–1.
 */
export async function GET(request: Request) {
  const denied = await assertAdmin();
  if (denied) return denied;

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    supabase = await createClient();
  }

  const url = new URL(request.url);
  const from = url.searchParams.get('from')?.trim() || null;
  const to = url.searchParams.get('to')?.trim() || null;
  const service = url.searchParams.get('service')?.trim() || null;
  const cleaner = url.searchParams.get('cleaner')?.trim() || null;
  const modeParam = url.searchParams.get('mode')?.trim().toLowerCase();
  const mode = modeParam === 'projected' ? 'projected' : 'realized';

  try {
    const data = await fetchProfitDashboardData(supabase, {
      dateFrom: from,
      dateTo: to,
      serviceType: service && service !== 'All' ? service : null,
      cleanerId: cleaner || null,
      mode,
    });
    return NextResponse.json(profitDashboardToApiJson(data));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load profit data';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
