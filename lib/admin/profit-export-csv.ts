import type { ProfitDashboardData } from '@/lib/admin/profit-dashboard-data';

function csvLine(cells: (string | number | null | undefined)[]): string {
  return cells
    .map((c) => {
      if (c == null) return '';
      const s = String(c);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(',');
}

/**
 * Single CSV for BI tools — sections separated by blank lines (RFC-style).
 */
export function buildProfitDashboardCsv(data: ProfitDashboardData): string {
  const lines: string[] = [];
  lines.push(csvLine(['profit_export_version', '1']));
  lines.push(csvLine(['generated_at', new Date().toISOString()]));
  lines.push(csvLine(['mode', data.mode]));
  lines.push('');

  lines.push(csvLine(['section', 'cash_flow']));
  lines.push(
    csvLine([
      'revenue_received_cents',
      data.cashFlow.revenueReceivedCents,
      'booking_date_filter_realized_revenue',
    ])
  );
  lines.push(csvLine(['payouts_sent_cents', data.cashFlow.payoutsSentCents, data.cashFlow.payoutQueryLabel]));
  lines.push(csvLine(['net_cash_flow_cents', data.cashFlow.netCashFlowCents]));
  lines.push(csvLine(['upcoming_payouts_cents', data.cashFlow.upcomingPayoutsCents, 'pending_processing']));
  lines.push('');

  lines.push(csvLine(['section', 'summary_active']));
  lines.push(
    csvLine([
      'total_revenue_cents',
      data.summary.totalRevenueCents,
      'total_cost_cents',
      data.summary.totalCostCents,
      'total_profit_cents',
      data.summary.totalProfitCents,
    ])
  );
  lines.push('');

  lines.push(csvLine(['section', 'service_breakdown']));
  lines.push(csvLine(['service_type', 'revenue_cents', 'profit_cents', 'margin_pct']));
  for (const r of data.byService) {
    lines.push(csvLine([r.serviceType, r.revenueCents, r.profitCents, r.marginPct ?? '']));
  }
  lines.push('');

  lines.push(csvLine(['section', 'service_optimization']));
  lines.push(
    csvLine([
      'service_type',
      'margin_pct',
      'revenue_share_pct',
      'insight',
      'suggested_price_increase_pct',
    ])
  );
  for (const s of data.serviceInsights) {
    lines.push(
      csvLine([
        s.serviceType,
        s.marginPct ?? '',
        s.revenueSharePct,
        s.insight,
        s.suggestedPriceIncreasePct ?? '',
      ])
    );
  }
  lines.push('');

  lines.push(csvLine(['section', 'cleaner_efficiency']));
  lines.push(
    csvLine([
      'cleaner_id',
      'name',
      'jobs',
      'revenue_cents',
      'cost_cents',
      'profit_cents',
      'margin_pct',
      'total_hours',
      'distinct_days',
      'profit_per_hour_cents',
      'revenue_per_hour_cents',
      'jobs_per_day',
    ])
  );
  for (const c of data.cleanerPerformance) {
    lines.push(
      csvLine([
        c.cleanerId,
        c.name,
        c.jobCount,
        c.revenueCents,
        c.costCents,
        c.profitCents,
        c.marginPct ?? '',
        c.totalHours,
        c.distinctWorkDays,
        c.profitPerHourCents ?? '',
        c.revenuePerHourCents ?? '',
        c.jobsPerDay ?? '',
      ])
    );
  }
  lines.push('');

  lines.push(csvLine(['section', 'alerts']));
  lines.push(csvLine(['severity', 'code', 'message']));
  for (const a of data.alerts) {
    lines.push(csvLine([a.severity, a.code, a.message]));
  }

  return lines.join('\n') + '\n';
}
