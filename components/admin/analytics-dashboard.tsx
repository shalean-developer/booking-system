'use client';

import React, { useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  CalendarRange,
  Filter,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  Sparkles,
  Percent,
  Gauge,
  CalendarClock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { fetcher } from '@/lib/swr-config';
import Link from 'next/link';

const SERVICE_OPTIONS = [
  { value: 'all', label: 'All services' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Airbnb', label: 'Airbnb' },
  { value: 'Deep', label: 'Deep Clean' },
  { value: 'Move In/Out', label: 'Move In/Out' },
  { value: 'Carpet', label: 'Carpet' },
] as const;

export type AnalyticsApiResponse = {
  ok: true;
  meta: {
    dateFrom: string;
    dateTo: string;
    service: string;
    rangeDays: number;
    generatedAt: string;
  };
  revenue: {
    totalCents: number;
    totalZar: number;
    todayZar: number;
    weekZar: number;
    monthZar: number;
    avgBookingValueZar: number;
    paidBookingsInRange: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  customers: {
    total: number;
    activeLast30Days: number;
    newLast7Days: number;
  };
  cleaners: Array<{
    id: string;
    name: string;
    jobsCompleted: number;
    jobsPaid: number;
    hoursWorked: number;
    utilizationPct: number;
    avgJobDurationMinutes: number;
  }>;
  demand: {
    avgDailyBookings: number;
    activeCleaners: number;
    demandRatio: number;
    rangeDays: number;
  };
  surge: {
    totalSurgeZar: number;
    avgSurgeMultiplier: number;
    bookingsWithSurgeSample: number;
  };
  discounts: {
    totalDiscountZar: number;
    avgDiscountPerBookingZar: number;
    promoBookings: number;
  };
  loyalty: {
    pointsIssued: number;
    pointsRedeemed: number;
  };
  timeseries: Array<{ date: string; revenueCents: number; bookings: number }>;
};

export type ForecastApiResponse = {
  ok: true;
  pricing?: {
    enableForecastSurge: boolean;
  };
  meta: {
    historyFrom: string;
    historyTo: string;
    historyDayCount: number;
    horizon: number;
    window: number;
    activeCleaners: number;
    avgJobsPerCleanerPerDay: number;
    dailyCapacity: number;
    generatedAt: string;
    service: string;
  };
  forecastBookings: number[];
  forecastRevenue: number[];
  forecastRevenueZar: number[];
  forecastDates: string[];
  demandAlerts: Array<{
    date: string;
    weekdayLabel: string;
    demand_high: boolean;
    forecastBookings: number;
    dailyCapacity: number;
    message: string;
    surgeSuggestion?: string;
  }>;
  cleanerNeeds: number[];
  historyVsMovingAverage: Array<{
    date: string;
    actualBookings: number;
    actualRevenueZar: number;
    predictedBookings: number;
    predictedRevenueZar: number;
  }>;
  forecastMeta: {
    window: number;
    horizon: number;
    historyDays: number;
    activeCleaners: number;
    avgJobsPerCleanerPerDay: number;
    dailyCapacity: number;
    lastMaBookings: number;
    lastMaRevenueZar: number;
  };
};

function formatZar(n: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function buildQuery(dateFrom: string, dateTo: string, service: string) {
  const p = new URLSearchParams();
  p.set('date_from', dateFrom);
  p.set('date_to', dateTo);
  if (service && service !== 'all') p.set('service', service);
  return p.toString();
}

export function AnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';
  const service = searchParams.get('service') ?? 'all';

  const defaultRange = useMemo(() => {
    const t = new Date();
    const end = t.toISOString().slice(0, 10);
    const start = new Date(t);
    start.setDate(start.getDate() - 29);
    return { from: start.toISOString().slice(0, 10), to: end };
  }, []);

  const effectiveFrom = dateFrom || defaultRange.from;
  const effectiveTo = dateTo || defaultRange.to;

  const swrKey = `/api/admin/analytics?${buildQuery(effectiveFrom, effectiveTo, service)}`;

  const forecastParams = new URLSearchParams();
  forecastParams.set('days', '60');
  if (service && service !== 'all') forecastParams.set('service', service);
  const forecastKey = `/api/admin/forecast?${forecastParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<AnalyticsApiResponse>(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const {
    data: forecastData,
    error: forecastError,
    isLoading: forecastLoading,
  } = useSWR<ForecastApiResponse>(forecastKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const applyFilters = useCallback(
    (next: { dateFrom?: string; dateTo?: string; service?: string }) => {
      const p = new URLSearchParams();
      p.set('date_from', next.dateFrom ?? effectiveFrom);
      p.set('date_to', next.dateTo ?? effectiveTo);
      const svc = next.service ?? service;
      if (svc && svc !== 'all') p.set('service', svc);
      router.push(`/admin/dashboard?${p.toString()}`);
    },
    [router, effectiveFrom, effectiveTo, service],
  );

  const chartData = useMemo(() => {
    if (!data?.timeseries?.length) return [];
    return data.timeseries.map((row) => ({
      date: row.date.slice(5),
      revenue: Math.round((row.revenueCents / 100) * 100) / 100,
      bookings: row.bookings,
    }));
  }, [data]);

  const forecastChartRows = useMemo(() => {
    if (!forecastData?.historyVsMovingAverage?.length) return [];
    const hist = forecastData.historyVsMovingAverage;
    const tail = hist.slice(-21);
    const histRows = tail.map((r) => ({
      label: r.date.slice(5),
      fullDate: r.date,
      actualBookings: r.actualBookings,
      predictedBookings: r.predictedBookings,
      kind: 'history' as const,
    }));
    const dates = forecastData.forecastDates ?? [];
    const fb = forecastData.forecastBookings ?? [];
    const fcRows = dates.map((d, i) => ({
      label: d.slice(5),
      fullDate: d,
      actualBookings: null as number | null,
      predictedBookings: fb[i] ?? 0,
      kind: 'forecast' as const,
    }));
    return [...histRows, ...fcRows];
  }, [forecastData]);

  const highDemandAlerts = useMemo(() => {
    if (!forecastData?.demandAlerts?.length) return [];
    return forecastData.demandAlerts.filter((a) => a.demand_high);
  }, [forecastData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Revenue, bookings, cleaners, and demand — scoped to your date range (
            {data?.meta?.dateFrom ?? effectiveFrom} → {data?.meta?.dateTo ?? effectiveTo}).
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Today / week / month revenue uses rolling windows in business timezone.{' '}
            <Link href="/admin/profit" className="text-blue-600 hover:underline font-medium">
              Profit dashboard
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
          <CardDescription>Refine metrics — charts use the same range.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-0">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                From
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => applyFilters({ dateFrom: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                To
              </label>
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => applyFilters({ dateTo: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="w-full sm:w-56">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Service
            </label>
            <Select value={service} onValueChange={(v) => applyFilters({ service: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load analytics. You may need to refresh or check permissions.
        </div>
      )}

      {isLoading && !data && (
        <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading analytics…
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total revenue (range)"
              value={formatZar(data.revenue.totalZar)}
              sub={`${data.revenue.paidBookingsInRange} paid bookings`}
              icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            />
            <KpiCard
              title="Total bookings"
              value={String(data.bookings.total)}
              sub={`${data.bookings.completed} completed · ${data.bookings.pending} in progress · ${data.bookings.cancelled} cancelled`}
              icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
            />
            <KpiCard
              title="Avg booking value"
              value={formatZar(data.revenue.avgBookingValueZar)}
              sub="Paid bookings in range"
              icon={<CalendarRange className="h-5 w-5 text-violet-600" />}
            />
            <KpiCard
              title="Active customers"
              value={String(data.customers.activeLast30Days)}
              sub={`${data.customers.total} total · +${data.customers.newLast7Days} new (7d)`}
              icon={<Users className="h-5 w-5 text-amber-600" />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MiniStat label="Today (rolling)" value={formatZar(data.revenue.todayZar)} />
            <MiniStat label="Last 7 days" value={formatZar(data.revenue.weekZar)} />
            <MiniStat label="Last 30 days" value={formatZar(data.revenue.monthZar)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Revenue over time</CardTitle>
                <CardDescription>Daily revenue (paid, non-excluded) in range</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {chartData.length === 0 ? (
                  <p className="text-sm text-gray-500 py-12 text-center">No data for this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${v}`} />
                      <Tooltip
                        formatter={(v) => [formatZar(typeof v === 'number' ? v : Number(v) || 0), 'Revenue']}
                        labelFormatter={(l) => `Day ${l}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue (ZAR)"
                        stroke="#059669"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Bookings over time</CardTitle>
                <CardDescription>Paid bookings per day</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {chartData.length === 0 ? (
                  <p className="text-sm text-gray-500 py-12 text-center">No data for this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" name="Bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-base">Forecast</CardTitle>
                  <CardDescription>
                    Next {forecastData?.meta?.horizon ?? 7} days from a {forecastData?.meta?.window ?? 7}
                    -day moving average of paid bookings (last {forecastData?.meta?.historyDayCount ?? 60}{' '}
                    days). Active cleaners: {forecastData?.meta?.activeCleaners ?? '—'}.
                    {forecastData?.pricing?.enableForecastSurge ? (
                      <span className="block mt-1 text-indigo-700 font-medium">
                        Forecast pricing is on — multipliers apply to checkout before real-time surge.
                      </span>
                    ) : (
                      <span className="block mt-1 text-gray-500">
                        Forecast pricing is off (toggle on the main admin dashboard).
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {forecastError && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Forecast could not be loaded. Check permissions or try refreshing.
                </p>
              )}
              {forecastLoading && !forecastData && (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading forecast…
                </div>
              )}
              {forecastData && (
                <>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="h-[280px] min-h-[240px]">
                      {forecastChartRows.length === 0 ? (
                        <p className="text-sm text-gray-500 py-12 text-center">Not enough history to chart.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={forecastChartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip
                              labelFormatter={(_, payload) => {
                                const p = payload?.[0]?.payload as { fullDate?: string } | undefined;
                                return p?.fullDate ?? '';
                              }}
                              formatter={(v, name) => {
                                const n = typeof v === 'number' ? v : Number(v);
                                const s = Number.isFinite(n) ? n.toFixed(1) : '—';
                                const label =
                                  name === 'actualBookings'
                                    ? 'Actual bookings'
                                    : 'Predicted (MA / forecast)';
                                return [s, label];
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="actualBookings"
                              name="Actual bookings"
                              stroke="#4f46e5"
                              strokeWidth={2}
                              dot={false}
                              connectNulls={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="predictedBookings"
                              name="Predicted (MA / forecast)"
                              stroke="#f97316"
                              strokeWidth={2}
                              strokeDasharray="5 4"
                              dot={false}
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Solid: daily paid bookings. Dashed: trailing moving average on history; flat extension
                        for the next {forecastData.meta.horizon} days.
                      </p>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50/80">
                            <th className="py-2 px-3 font-medium">Date</th>
                            <th className="py-2 px-3 font-medium">Bookings (pred.)</th>
                            <th className="py-2 px-3 font-medium">Revenue (pred.)</th>
                            <th className="py-2 px-3 font-medium">Cleaners (est.)</th>
                            <th className="py-2 px-3 font-medium">Demand</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(forecastData.forecastDates ?? []).map((d, i) => {
                            const alert = forecastData.demandAlerts[i];
                            const high = alert?.demand_high;
                            return (
                              <tr key={d} className="border-b border-gray-50">
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="text-gray-900">{d}</span>
                                  {alert?.weekdayLabel ? (
                                    <span className="text-gray-400 text-xs ml-1">({alert.weekdayLabel})</span>
                                  ) : null}
                                </td>
                                <td className="py-2.5 px-3 tabular-nums">
                                  {(forecastData.forecastBookings[i] ?? 0).toFixed(1)}
                                </td>
                                <td className="py-2.5 px-3 tabular-nums">
                                  {formatZar(forecastData.forecastRevenue[i] ?? 0)}
                                </td>
                                <td className="py-2.5 px-3 tabular-nums">
                                  {forecastData.cleanerNeeds[i] ?? '—'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {high ? (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 text-xs font-medium px-2 py-0.5">
                                      High
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">OK</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {highDemandAlerts.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 space-y-2">
                      <p className="text-sm font-semibold text-amber-900">Demand alerts</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-amber-950">
                        {highDemandAlerts.map((a) => (
                          <li key={a.date}>
                            <span className="font-medium">
                              High demand expected{a.weekdayLabel ? ` on ${a.weekdayLabel}` : ''}
                            </span>
                            {a.surgeSuggestion ? (
                              <span className="text-amber-900/90"> — {a.surgeSuggestion}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-base">Demand vs supply</CardTitle>
                </div>
                <CardDescription>
                  Avg daily bookings ÷ active cleaners ({data.demand.activeCleaners})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Demand ratio:</span>{' '}
                  <strong className="text-gray-900">{data.demand.demandRatio.toFixed(2)}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Avg daily bookings:</span>{' '}
                  <strong>{data.demand.avgDailyBookings}</strong>
                </p>
                <p className="text-xs text-gray-400">
                  Surge usage (sample with multiplier): {data.surge.bookingsWithSurgeSample} bookings
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-pink-600" />
                  <CardTitle className="text-base">Surge & discounts</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Surge revenue:</span>{' '}
                  <strong>{formatZar(data.surge.totalSurgeZar)}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Avg surge multiplier:</span>{' '}
                  <strong>{data.surge.avgSurgeMultiplier.toFixed(2)}×</strong>
                </p>
                <p>
                  <span className="text-gray-500">Discounts given:</span>{' '}
                  <strong>{formatZar(data.discounts.totalDiscountZar)}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Avg discount / booking:</span>{' '}
                  <strong>{formatZar(data.discounts.avgDiscountPerBookingZar)}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Promo bookings:</span>{' '}
                  <strong>{data.discounts.promoBookings}</strong>
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-base">Loyalty</CardTitle>
                </div>
                <CardDescription>Issued ≈ points earned on paid jobs; redeemed from bookings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Points issued (est.):</span>{' '}
                  <strong>{data.loyalty.pointsIssued.toLocaleString()}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Points redeemed:</span>{' '}
                  <strong>{data.loyalty.pointsRedeemed.toLocaleString()}</strong>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Cleaner performance</CardTitle>
              <CardDescription>
                Jobs and hours from paid bookings in range (assigned cleaner). Utilization = hours ÷ (9h ×
                days in range).
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Jobs (paid)</th>
                    <th className="py-2 pr-4 font-medium">Completed</th>
                    <th className="py-2 pr-4 font-medium">Hours</th>
                    <th className="py-2 font-medium">Utilization %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cleaners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No cleaner-assigned paid bookings in this range.
                      </td>
                    </tr>
                  ) : (
                    data.cleaners.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-900">{c.name}</td>
                        <td className="py-2.5 pr-4">{c.jobsPaid}</td>
                        <td className="py-2.5 pr-4">{c.jobsCompleted}</td>
                        <td className="py-2.5 pr-4">{c.hoursWorked}</td>
                        <td className="py-2.5">{c.utilizationPct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className={cn('border-gray-200 shadow-sm overflow-hidden')}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-gray-500 leading-snug">{sub}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-2.5">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900 tabular-nums">{value}</p>
    </div>
  );
}
