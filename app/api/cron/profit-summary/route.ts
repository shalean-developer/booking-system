import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { requireCronSecret } from '@/lib/cron-secret';
import { createServiceClient } from '@/lib/supabase-server';
import { fetchProfitDashboardData } from '@/lib/admin/profit-dashboard-data';
import { buildProfitDashboardCsv } from '@/lib/admin/profit-export-csv';
import { resolveAdminNotificationEmail } from '@/lib/admin-email';
import { postResendEmail, validateResendConfig } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * GET /api/cron/profit-summary?secret=CRON_SECRET
 * Scheduled financial snapshot (default: last 7 days realized). Optional email to `ADMIN_EMAIL` with CSV attachment.
 */
export async function GET(req: NextRequest) {
  try {
    const unauthorized = requireCronSecret(req);
    if (unauthorized) return unauthorized;

    const supabase = createServiceClient();
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const data = await fetchProfitDashboardData(supabase, {
      dateFrom: ymd(start),
      dateTo: ymd(end),
      serviceType: null,
      cleanerId: null,
      mode: 'realized',
    });

    const csv = buildProfitDashboardCsv(data);
    const summary = {
      ok: true as const,
      range: { from: ymd(start), to: ymd(end) },
      netProfitCents: data.netProfitCents,
      revenueCents: data.realized.summary.totalRevenueCents,
      payoutsSentCents: data.cashFlow.payoutsSentCents,
      upcomingPayoutsCents: data.cashFlow.upcomingPayoutsCents,
    };

    const to = resolveAdminNotificationEmail();
    const emailOk = validateResendConfig().ok;
    if (emailOk) {
      try {
        const senderEmail = process.env.SENDER_EMAIL || 'noreply@shalean.co.za';
        const fromAddress = `Shalean Reports <${senderEmail}>`;
        await postResendEmail({
          from: fromAddress,
          to: [to],
          subject: `[Profit] ${summary.range.from}–${summary.range.to} · net ${(data.netProfitCents / 100).toFixed(0)} ZAR`,
          html: `<p>Automated profit intelligence export (${summary.range.from} to ${summary.range.to}).</p>
<p><strong>Net profit (realized − refunds):</strong> ${(data.netProfitCents / 100).toFixed(2)} ZAR<br/>
<strong>Cash flow (range):</strong> revenue ${(data.cashFlow.revenueReceivedCents / 100).toFixed(2)} ZAR, payouts sent ${(data.cashFlow.payoutsSentCents / 100).toFixed(2)} ZAR, net ${(data.cashFlow.netCashFlowCents / 100).toFixed(2)} ZAR</p>
<p>CSV attached. <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/profit?from=${summary.range.from}&to=${summary.range.to}">Open dashboard</a></p>`,
          attachments: [
            {
              filename: `profit-${summary.range.from}_${summary.range.to}.csv`,
              content: Buffer.from(csv, 'utf8').toString('base64'),
            },
          ],
        });
      } catch (e) {
        console.error('[profit-summary cron] email failed', e);
      }
    } else {
      console.warn('[profit-summary cron] RESEND not configured — skipping email');
    }

    return NextResponse.json({ ...summary, emailAttempted: emailOk });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[profit-summary cron]', e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
