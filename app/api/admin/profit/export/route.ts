import { NextResponse } from 'next/server';
import { assertAdmin, createClient, createServiceClient } from '@/lib/supabase-server';
import { fetchProfitDashboardData } from '@/lib/admin/profit-dashboard-data';
import { buildProfitDashboardCsv } from '@/lib/admin/profit-export-csv';

export const dynamic = 'force-dynamic';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * GET /api/admin/profit/export
 * Same query params as `/admin/profit`: from, to, service, cleaner, mode.
 * `format=csv` (default) or `format=html` (print-friendly summary + raw CSV in &lt;pre&gt;).
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
  const format = url.searchParams.get('format')?.trim().toLowerCase() || 'csv';

  try {
    const data = await fetchProfitDashboardData(supabase, {
      dateFrom: from,
      dateTo: to,
      serviceType: service && service !== 'All' ? service : null,
      cleanerId: cleaner || null,
      mode,
    });

    const csv = buildProfitDashboardCsv(data);

    if (format === 'html') {
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Profit report</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; color: #18181b; }
  h1 { font-size: 1.25rem; }
  .meta { color: #71717a; font-size: 0.875rem; margin-bottom: 16px; }
  pre { white-space: pre-wrap; font-size: 11px; background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px; }
  @media print { pre { font-size: 9px; } }
</style></head><body>
<h1>Profit intelligence export</h1>
<p class="meta">${escapeHtml(new Date().toISOString())} · mode: ${escapeHtml(data.mode)}</p>
<pre>${escapeHtml(csv)}</pre>
</body></html>`;
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="profit-report-${data.mode}-${Date.now()}.csv"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Export failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
