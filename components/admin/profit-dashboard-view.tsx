'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/admin/shared/page-header';
import { formatCurrency } from '@/lib/utils/formatting';
import type { ProfitDashboardData } from '@/lib/admin/profit-dashboard-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; color?: string; name?: string }[];
  label?: string;
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-zinc-900">{label}</p>
      <p className="text-zinc-600">
        {valueLabel}: {formatCurrency(Math.round(v), true)}
      </p>
    </div>
  );
}

const SERVICE_OPTIONS = [
  'All',
  'Standard',
  'Airbnb',
  'Deep',
  'Move In/Out',
  'Carpet',
] as const;

function severityPanelClass(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') return 'border-red-200 bg-red-50/80';
  if (severity === 'medium') return 'border-amber-200 bg-amber-50/70';
  return 'border-zinc-200 bg-white';
}

function severityBadgeClass(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') return 'bg-red-100 text-red-900';
  if (severity === 'medium') return 'bg-amber-100 text-amber-900';
  return 'bg-zinc-100 text-zinc-700';
}

function formatGrowth(v: number | null | undefined): string | null {
  if (v == null || Number.isNaN(v)) return null;
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

export function ProfitDashboardView({ data }: { data: ProfitDashboardData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exportSuffix = useMemo(() => {
    const q = searchParams.toString();
    return q ? `?${q}` : '';
  }, [searchParams]);

  const {
    mode,
    summary,
    daily,
    byService,
    cleaners,
    realized,
    projected,
    losses,
    netProfitCents,
    comparison,
    cleanerPerformance,
    alerts,
    optimization,
    meta,
    cleanerWalletLiability,
    payoutMetrics,
    cashFlow,
    serviceInsights,
    cleanerOptions,
  } = data;

  const chartData = useMemo(
    () =>
      daily.map((d) => ({
        date: d.date,
        revenueCents: d.revenueCents,
        profitCents: d.profitCents,
      })),
    [daily]
  );

  const marginPct =
    summary.profitMargin != null ? (summary.profitMargin * 100).toFixed(1) : '—';

  const onApplyFilters = (formData: FormData) => {
    const from = String(formData.get('from') ?? '').trim();
    const to = String(formData.get('to') ?? '').trim();
    const service = String(formData.get('service') ?? '').trim();
    const cleaner = String(formData.get('cleaner') ?? '').trim();
    const modeVal = String(formData.get('mode') ?? 'realized').trim();
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    if (service && service !== 'All') p.set('service', service);
    if (cleaner) p.set('cleaner', cleaner);
    if (modeVal === 'projected') p.set('mode', 'projected');
    const q = p.toString();
    router.push(q ? `/admin/profit?${q}` : '/admin/profit');
  };

  const defaultFrom = meta.filters.dateFrom ?? '';
  const defaultTo = meta.filters.dateTo ?? '';
  const defaultService = meta.filters.serviceType ?? 'All';
  const defaultCleaner = meta.filters.cleanerId ?? '';
  const defaultMode = meta.filters.mode ?? 'realized';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profit dashboard"
        description={
          mode === 'projected'
            ? 'Projected profit and loss: pipeline bookings; cleaner cost estimated with the same earnings model as live jobs (read-only).'
            : 'Realized profit and loss: completed bookings with approved earnings (read-only).'
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Outstanding cleaner liability</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {formatCurrency(cleanerWalletLiability.totalLiabilityCents, true)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Sum of wallet balances (available + pending) · {cleanerWalletLiability.walletRowCount} row
            {cleanerWalletLiability.walletRowCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Payouts completed ({payoutMetrics.windowDays}d)</p>
          <p className="mt-1 text-lg font-semibold text-emerald-800">{payoutMetrics.completedCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Wallet tx type=payout, status=completed</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Payout failures ({payoutMetrics.windowDays}d)</p>
          <p className="mt-1 text-lg font-semibold text-red-800">{payoutMetrics.failedCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Refunded to wallet or retry scheduled</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">In-flight payouts</p>
          <p className="mt-1 text-lg font-semibold text-blue-800">{payoutMetrics.processingCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Awaiting Paystack / webhook</p>
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-sky-950">Cash intelligence</h2>
        <p className="mt-1 text-xs text-sky-900/80">
          Revenue matches realized bookings in your filter. Payout totals use wallet transaction dates —{' '}
          {cashFlow.payoutQueryLabel}.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-sky-100 bg-white p-3">
            <p className="text-xs font-medium text-sky-800">Revenue received</p>
            <p className="mt-1 text-lg font-semibold text-sky-950">
              {formatCurrency(cashFlow.revenueReceivedCents, true)}
            </p>
            <p className="mt-1 text-[11px] text-sky-800/80">Realized booking revenue (range)</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-white p-3">
            <p className="text-xs font-medium text-sky-800">Payouts sent</p>
            <p className="mt-1 text-lg font-semibold text-sky-950">
              {formatCurrency(cashFlow.payoutsSentCents, true)}
            </p>
            <p className="mt-1 text-[11px] text-sky-800/80">Completed wallet payouts (timing window above)</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
            <p className="text-xs font-medium text-emerald-900">Net cash flow</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">
              {formatCurrency(cashFlow.netCashFlowCents, true)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-900/80">Revenue received − payouts sent</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3">
            <p className="text-xs font-medium text-amber-900">Upcoming payouts</p>
            <p className="mt-1 text-lg font-semibold text-amber-950">
              {formatCurrency(cashFlow.upcomingPayoutsCents, true)}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/80">Pending + processing (current queue)</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApplyFilters(new FormData(e.currentTarget));
        }}
        className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="mode">Mode</Label>
          <select
            id="mode"
            name="mode"
            defaultValue={defaultMode}
            className={cn(
              'flex h-10 w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <option value="realized">Realized</option>
            <option value="projected">Projected</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={defaultFrom} className="w-[160px]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={defaultTo} className="w-[160px]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="service">Service</Label>
          <select
            id="service"
            name="service"
            defaultValue={defaultService}
            className={cn(
              'flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            {SERVICE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cleaner">Cleaner</Label>
          <select
            id="cleaner"
            name="cleaner"
            defaultValue={defaultCleaner}
            className={cn(
              'flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <option value="">All cleaners</option>
            {cleanerOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/profit')}>
          Clear
        </Button>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <Button type="button" variant="secondary" size="sm" asChild>
            <a href={`/api/admin/profit/export${exportSuffix}`}>Export CSV</a>
          </Button>
          <Button type="button" variant="secondary" size="sm" asChild>
            <a
              href={`/api/admin/profit/export${exportSuffix ? `${exportSuffix}&` : '?'}format=html`}
              target="_blank"
              rel="noreferrer"
            >
              Printable / PDF
            </a>
          </Button>
        </div>
        <p className="text-xs text-zinc-500 w-full sm:w-auto">
          {meta.bookingCount} booking{meta.bookingCount !== 1 ? 's' : ''} matched
        </p>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Realized (approved)</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {formatCurrency(realized.summary.totalProfitCents, true)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{realized.bookingCount} bookings</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Projected (pipeline)</p>
          <p className="mt-1 text-lg font-semibold text-indigo-800">
            {formatCurrency(projected.summary.totalProfitCents, true)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{projected.bookingCount} bookings · earnings model</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Refunded (losses)</p>
          <p className="mt-1 text-lg font-semibold text-red-900">
            {formatCurrency(losses.totalLossesCents, true)}
          </p>
          <p className="mt-1 text-xs text-red-700/80">{losses.refundBookingCount} bookings</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Net profit (realized − refunds)</p>
          <p className="mt-1 text-lg font-semibold text-emerald-900">
            {formatCurrency(netProfitCents, true)}
          </p>
          <p className="mt-1 text-xs text-emerald-800/90">Realized gross profit minus refund totals in range</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-950">Alerts</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {alerts.map((a, i) => (
              <li
                key={`${a.code}-${i}`}
                className={cn(
                  'rounded-md border px-3 py-2',
                  a.severity === 'critical'
                    ? 'border-red-200 bg-red-50 text-red-950'
                    : a.severity === 'warning'
                      ? 'border-amber-200 bg-white text-amber-950'
                      : 'border-zinc-200 bg-white text-zinc-800'
                )}
              >
                <span className="font-medium capitalize">{a.severity}:</span> {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className={cn(
          'rounded-xl border p-5 shadow-sm',
          severityPanelClass(optimization.merged.severity)
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">AI suggestions</h2>
            <p className="mt-1 text-xs text-zinc-600">
              Rule-based insights from the last {optimization.bookingSamplesAnalyzed} completed booking
              {optimization.bookingSamplesAnalyzed !== 1 ? 's' : ''} (newest first) plus service aggregates.
              Does not change pricing or payouts.
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
              severityBadgeClass(optimization.merged.severity)
            )}
          >
            {optimization.merged.severity} priority
          </span>
        </div>

        {optimization.autoOptimizationEnabled && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
            <p className="font-medium">Auto-optimization is enabled in env</p>
            <p className="mt-1 text-amber-900/90">{optimization.autoOptimizationPolicy}</p>
          </div>
        )}

        {optimization.merged.warnings.length === 0 && optimization.merged.suggestions.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">No issues flagged for this filter range.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {optimization.merged.warnings.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Warnings</p>
                <ul className="mt-2 max-h-[220px] space-y-2 overflow-y-auto text-sm">
                  {optimization.merged.warnings.map((line, i) => (
                    <li
                      key={`w-${i}`}
                      className={cn(
                        'rounded-md border px-2.5 py-2',
                        line.includes('Critical')
                          ? 'border-red-300 bg-red-100/90 text-red-950'
                          : 'border-zinc-100 bg-white/80 text-zinc-800'
                      )}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {optimization.merged.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Suggestions</p>
                <ul className="mt-2 max-h-[220px] space-y-2 overflow-y-auto text-sm">
                  {optimization.merged.suggestions.map((line, i) => (
                    <li
                      key={`s-${i}`}
                      className={cn(
                        'rounded-md border px-2.5 py-2',
                        line.includes('Critical')
                          ? 'border-red-300 bg-red-100/90 text-red-950'
                          : 'border-zinc-100 bg-white/80 text-zinc-800'
                      )}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/admin/pricing">Review pricing</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/admin/bookings">View bookings</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/admin/services">Services</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total revenue</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatCurrency(summary.totalRevenueCents, true)}
          </p>
          {mode === 'realized' && comparison?.revenueGrowthPct != null && (
            <p className="mt-1 text-xs font-medium text-emerald-700">
              vs prior: {formatGrowth(comparison.revenueGrowthPct)}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {mode === 'projected' ? 'Pipeline booking totals' : 'Completed, approved'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total cost</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatCurrency(summary.totalCostCents, true)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {mode === 'projected' ? 'Estimated cleaner payout (earnings model)' : 'Cleaner payout (earnings_final)'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total profit</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(summary.totalProfitCents, true)}
          </p>
          {mode === 'realized' && comparison?.profitGrowthPct != null && (
            <p className="mt-1 text-xs font-medium text-emerald-700">
              vs prior: {formatGrowth(comparison.profitGrowthPct)}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {mode === 'projected' ? 'Revenue − estimated cost' : 'company_profit_cents or revenue − payout'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Profit margin</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{marginPct}%</p>
          {mode === 'realized' && comparison?.marginDeltaPctPoints != null && (
            <p className="mt-1 text-xs font-medium text-zinc-600">
              vs prior margin: {comparison.marginDeltaPctPoints >= 0 ? '+' : ''}
              {comparison.marginDeltaPctPoints.toFixed(1)} pts
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500">Profit ÷ revenue</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Revenue trend</h2>
          <div className="h-[280px] w-full">
            {chartData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-zinc-500">No data in range</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-zinc-500" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-zinc-500"
                    tickFormatter={(v) => formatCurrency(Math.round(v), false)}
                  />
                  <Tooltip
                    content={(props: unknown) => {
                      const p = props as {
                        active?: boolean;
                        payload?: { value?: number }[];
                        label?: string;
                      };
                      return (
                        <ChartTooltip
                          active={p.active}
                          payload={p.payload}
                          label={p.label}
                          valueLabel="Revenue"
                        />
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenueCents"
                    name="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Profit trend</h2>
          <div className="h-[280px] w-full">
            {chartData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-zinc-500">No data in range</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-zinc-500" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-zinc-500"
                    tickFormatter={(v) => formatCurrency(Math.round(v), false)}
                  />
                  <Tooltip
                    content={(props: unknown) => {
                      const p = props as {
                        active?: boolean;
                        payload?: { value?: number }[];
                        label?: string;
                      };
                      return (
                        <ChartTooltip
                          active={p.active}
                          payload={p.payload}
                          label={p.label}
                          valueLabel="Profit"
                        />
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="profitCents"
                    name="Profit"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Service performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-zinc-600">
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Revenue</th>
                <th className="px-4 py-2 font-medium">Profit</th>
                <th className="px-4 py-2 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {byService.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No data
                  </td>
                </tr>
              ) : (
                byService.map((row) => (
                  <tr key={row.serviceType} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-900">{row.serviceType}</td>
                    <td className="px-4 py-2.5">{formatCurrency(row.revenueCents, true)}</td>
                    <td className="px-4 py-2.5">{formatCurrency(row.profitCents, true)}</td>
                    <td className="px-4 py-2.5">
                      {row.marginPct != null ? `${row.marginPct.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-violet-200 bg-violet-50/40 shadow-sm overflow-hidden">
        <div className="border-b border-violet-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-violet-950">Service optimization insights</h2>
          <p className="text-xs text-violet-900/80 mt-0.5">
            Portfolio-relative margins (σ-band) and illustrative list-price bumps to reach ~22% margin holding cost
            fixed — align real pricing in Admin → Pricing.
          </p>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-zinc-600">
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Margin</th>
                <th className="px-4 py-2 font-medium">Rev. share</th>
                <th className="px-4 py-2 font-medium">Insight</th>
                <th className="px-4 py-2 font-medium">Suggest bump</th>
              </tr>
            </thead>
            <tbody>
              {serviceInsights.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No service data
                  </td>
                </tr>
              ) : (
                serviceInsights.map((row) => (
                  <tr key={row.serviceType} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-900">{row.serviceType}</td>
                    <td className="px-4 py-2.5">{row.marginPct != null ? `${row.marginPct.toFixed(1)}%` : '—'}</td>
                    <td className="px-4 py-2.5">{row.revenueSharePct.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 capitalize">{row.insight.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5">
                      {row.suggestedPriceIncreasePct != null
                        ? `+${row.suggestedPriceIncreasePct.toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Cleaner profit performance</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Realized jobs: attributed revenue, cost, profit, and margin per cleaner (team bookings split by earnings
            share). Efficiency uses attributed hours (duration / total_hours).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-zinc-600">
                <th className="px-4 py-2 font-medium">Cleaner</th>
                <th className="px-4 py-2 font-medium">Jobs</th>
                <th className="px-4 py-2 font-medium">Revenue</th>
                <th className="px-4 py-2 font-medium">Cost</th>
                <th className="px-4 py-2 font-medium">Profit</th>
                <th className="px-4 py-2 font-medium">Margin</th>
                <th className="px-4 py-2 font-medium">Profit/hr</th>
                <th className="px-4 py-2 font-medium">Rev/hr</th>
                <th className="px-4 py-2 font-medium">Jobs/day</th>
              </tr>
            </thead>
            <tbody>
              {cleanerPerformance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                    No realized cleaner data in this range
                  </td>
                </tr>
              ) : (
                cleanerPerformance.map((row) => (
                  <tr key={row.cleanerId} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-900">{row.name}</td>
                    <td className="px-4 py-2.5">{row.jobCount}</td>
                    <td className="px-4 py-2.5">{formatCurrency(row.revenueCents, true)}</td>
                    <td className="px-4 py-2.5">{formatCurrency(row.costCents, true)}</td>
                    <td className="px-4 py-2.5">{formatCurrency(row.profitCents, true)}</td>
                    <td className="px-4 py-2.5">
                      {row.marginPct != null ? `${row.marginPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.profitPerHourCents != null ? formatCurrency(row.profitPerHourCents, true) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.revenuePerHourCents != null ? formatCurrency(row.revenuePerHourCents, true) : '—'}
                    </td>
                    <td className="px-4 py-2.5">{row.jobsPerDay != null ? row.jobsPerDay.toFixed(2) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Cleaner leaderboard</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Earnings from team assignments and solo completed jobs (approved).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-zinc-600">
                <th className="px-4 py-2 font-medium">Cleaner</th>
                <th className="px-4 py-2 font-medium">Jobs</th>
                <th className="px-4 py-2 font-medium">Total earnings</th>
                <th className="px-4 py-2 font-medium">Avg / job</th>
              </tr>
            </thead>
            <tbody>
              {cleaners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No cleaner payouts in this set
                  </td>
                </tr>
              ) : (
                cleaners.map((row) => (
                  <tr key={row.cleanerId} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-900">{row.name}</td>
                    <td className="px-4 py-2.5">{row.jobCount}</td>
                    <td className="px-4 py-2.5">{formatCurrency(row.totalEarningsCents, true)}</td>
                    <td className="px-4 py-2.5">{formatCurrency(row.avgEarningsCents, true)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Scheduled reports</p>
        <p className="mt-1 text-xs leading-relaxed">
          Configure a Vercel cron (or external scheduler) to call{' '}
          <code className="rounded bg-white px-1 py-0.5 text-[11px]">GET /api/cron/profit-summary?secret=CRON_SECRET</code>
          . Sends last-7-days realized CSV to <code className="text-[11px]">ADMIN_EMAIL</code> when{' '}
          <code className="text-[11px]">RESEND_API_KEY</code> is set. Uses the same aggregates as this dashboard.
        </p>
      </div>
    </div>
  );
}
