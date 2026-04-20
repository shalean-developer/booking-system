'use client';

import { Fragment, useMemo } from 'react';
import Link from 'next/link';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/formatting';
import type { PricingAnalyticsResult } from '@/lib/analytics/getPricingAnalytics';
import { generatePricingSuggestions } from '@/lib/analytics/pricingSuggestions';
import type { PricingSuggestionImpact } from '@/lib/analytics/pricingSuggestions';
import { cn } from '@/lib/utils';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const IMPACT_BADGE_CLASS: Record<PricingSuggestionImpact, string> = {
  high: 'border-red-200 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-100 dark:border-red-900',
  medium:
    'border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800',
  low: 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
};

function typeLabel(type: string) {
  switch (type) {
    case 'underpricing':
      return 'Underpricing';
    case 'overpricing':
      return 'Overpricing risk';
    case 'demand':
      return 'Demand';
    case 'anomaly':
      return 'Anomaly';
    default:
      return type;
  }
}

function zarFromZar(amount: number, decimals = false) {
  return formatCurrency(Math.round(amount * 100), decimals);
}

type TooltipProps = {
  active?: boolean;
  label?: string;
  payload?: { value?: number; name?: string; dataKey?: string; color?: string }[];
};

function TrendTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-muted-foreground text-xs tabular-nums">
          {p.name}:{' '}
          {p.dataKey === 'revenue'
            ? zarFromZar(p.value ?? 0, false)
            : `${(p.value as number)?.toFixed(0) ?? '—'} R/h`}
        </p>
      ))}
    </div>
  );
}

export function PricingAnalyticsDashboard({ data }: { data: PricingAnalyticsResult }) {
  const suggestions = useMemo(() => generatePricingSuggestions(data), [data]);
  const maxHeat = Math.max(1, ...data.heatmap.map((c) => c.bookings));

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href="/admin/pricing"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          ← Pricing admin
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Pricing analytics</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Revenue, effective hourly rates, and demand from{' '}
          <code className="text-xs rounded bg-muted px-1 py-0.5">price_snapshot</code> (last 30 days,
          refreshed every minute). Coverage:{' '}
          <span className="font-medium text-foreground">{data.snapshotCoverageCount}</span> /{' '}
          {data.totalBookings} bookings with usable snapshot fields.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total revenue</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{zarFromZar(data.totalRevenue, false)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">From snapshot totals</CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total bookings</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{data.totalBookings}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Created in window</CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Avg hourly rate</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              R{data.avgHourlyRate.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}/h
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Hours-weighted from snapshots</CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Avg job duration</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{data.avgDuration.toFixed(2)} h</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Per cleaner (duration)</CardContent>
        </Card>
      </div>

      {/* Pricing insights (suggestions — admin review only) */}
      <section className="space-y-4" aria-labelledby="pricing-insights-heading">
        <div>
          <h2 id="pricing-insights-heading" className="text-lg font-semibold tracking-tight">
            Pricing insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-generated from the last 30 days — suggestions only; prices are not changed automatically.
          </p>
        </div>
        {suggestions.length === 0 ? (
          <Card className="rounded-2xl border border-dashed shadow-sm">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Not enough data yet for pricing suggestions. Check back after more bookings with{' '}
              <code className="text-xs">price_snapshot</code> coverage.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {suggestions.map((s, idx) => (
              <Card key={`${s.type}-${s.service}-${idx}`} className="rounded-2xl border shadow-sm overflow-hidden">
                <CardHeader className="pb-2 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {typeLabel(s.type)}
                      </p>
                      <CardTitle className="text-base font-semibold leading-snug pt-0.5">{s.service}</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('shrink-0 capitalize', IMPACT_BADGE_CLASS[s.impact])}
                    >
                      {s.impact} impact
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-foreground/90 leading-relaxed">
                    {s.message}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm border-t border-border/80 pt-3 text-muted-foreground">
                    <span className="font-medium text-foreground">Recommendation: </span>
                    {s.recommendation}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Service table */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Service performance</CardTitle>
          <CardDescription>Sorted by revenue · R/hour from snapshot effective rates</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg hours</TableHead>
                  <TableHead className="text-right">R/hour</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      No booking data in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.services.map((s) => (
                    <TableRow key={s.service}>
                      <TableCell className="font-medium">{s.service}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.bookings}</TableCell>
                      <TableCell className="text-right tabular-nums">{zarFromZar(s.revenue, false)}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.avg_hours.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        R{s.avg_rate.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Revenue &amp; hourly rate</CardTitle>
          <CardDescription>Daily series (UTC date from booking creation)</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] pt-0 min-w-0">
          {data.trends.every((t) => t.revenue === 0 && t.hourly_rate === 0) ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No revenue in this window.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat('en-ZA', { notation: 'compact', maximumFractionDigits: 0 }).format(v)
                  }
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}`}
                />
                <Tooltip content={<TrendTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (ZAR)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hourly_rate"
                  name="Avg R/hour"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Demand heatmap</CardTitle>
          <CardDescription>Bookings by day of week × start hour (6:00–18:00)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div
              className="grid gap-1 text-[10px] sm:text-xs"
              style={{
                gridTemplateColumns: `72px repeat(13, minmax(28px, 1fr))`,
              }}
            >
              <div />
              {Array.from({ length: 13 }, (_, i) => i + 6).map((h) => (
                <div key={h} className="text-center text-muted-foreground font-medium pb-1">
                  {h}
                </div>
              ))}
              {DAY_LABELS.map((label, dayIdx) => (
                <Fragment key={label}>
                  <div className="flex items-center font-medium text-muted-foreground pr-2 py-1">
                    {label}
                  </div>
                  {Array.from({ length: 13 }, (_, j) => j + 6).map((hour) => {
                    const cell = data.heatmap.find((c) => c.day === dayIdx && c.hour === hour);
                    const n = cell?.bookings ?? 0;
                    const intensity = n / maxHeat;
                    return (
                      <div
                        key={`${dayIdx}-${hour}`}
                        title={`${n} booking(s)`}
                        className={cn(
                          'aspect-square rounded-md flex items-center justify-center tabular-nums text-[10px] sm:text-xs border border-transparent',
                          n === 0 && 'bg-muted/40 text-muted-foreground',
                          n > 0 && 'text-foreground border-border'
                        )}
                        style={
                          n > 0
                            ? {
                                backgroundColor: `hsl(var(--primary) / ${0.12 + intensity * 0.78})`,
                              }
                            : undefined
                        }
                      >
                        {n > 0 ? n : ''}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomalies */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Pricing anomalies</CardTitle>
          <CardDescription>Effective rate under R120/h or over R600/h (aligned with V4 warnings)</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.anomalies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      No anomalies in this window.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.anomalies.map((a) => (
                    <TableRow key={a.booking_id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/admin/bookings/${a.booking_id}`}
                          className="text-primary hover:underline"
                        >
                          {a.booking_id.slice(0, 8)}…
                        </Link>
                      </TableCell>
                      <TableCell>{a.service}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        R{a.rate.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}/h
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{a.hours}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
