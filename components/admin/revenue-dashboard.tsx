'use client';

import useSWR from 'swr';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react';
import { fetcher } from '@/lib/swr-config';
import { formatCurrency } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';

type RevenueResponse = {
  ok: boolean;
  metrics?: {
    totalRevenueCents: number;
    todayRevenueCents: number;
    monthRevenueCents: number;
    totalBookings: number;
    avgBookingCents: number;
    growthPercent: number | null;
    last7DaysRevenueCents: number;
    prev7DaysRevenueCents: number;
  };
  topServices?: { service_type: string; revenueCents: number; count: number }[];
  chartData?: { date: string; revenueCents: number; bookings: number }[];
  recentBookings?: {
    id: string;
    customer_name: string | null;
    service_type: string | null;
    total_amount: number | null;
    created_at: string;
  }[];
  error?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const v = row?.value ?? 0;
  const isCents = row?.dataKey === 'revenueCents';
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-zinc-900">{label}</p>
      <p className="text-zinc-600">
        {isCents ? formatCurrency(v, true) : `${v} bookings`}
      </p>
    </div>
  );
}

export function RevenueDashboard({ embedded = false }: { embedded?: boolean }) {
  const { data, error, isLoading } = useSWR<RevenueResponse>('/api/admin/revenue', fetcher);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-zinc-200" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-100" />
          ))}
        </div>
        <div className="h-[300px] rounded-xl bg-zinc-100" />
      </div>
    );
  }

  if (error || !data?.ok || !data.metrics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {data?.error || 'Could not load revenue data.'}
      </div>
    );
  }

  const m = data.metrics;
  const growth = m.growthPercent ?? 0;
  const growthIcon =
    growth > 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-600" />
    ) : growth < 0 ? (
      <TrendingDown className="h-4 w-4 text-red-600" />
    ) : (
      <Minus className="h-4 w-4 text-zinc-400" />
    );

  const chartData = data.chartData ?? [];
  const topServices = data.topServices ?? [];
  const recent = data.recentBookings ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!embedded && (
            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Main dashboard
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Revenue dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Paid and completed bookings — amounts in ZAR (Johannesburg calendar for “today” and month).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total revenue" value={formatCurrency(m.totalRevenueCents, false)} />
        <KpiCard label="Today" value={formatCurrency(m.todayRevenueCents, false)} />
        <KpiCard label="This month" value={formatCurrency(m.monthRevenueCents, false)} />
        <KpiCard label="Total bookings" value={String(m.totalBookings)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Revenue over time</h2>
          <p className="mb-4 text-xs text-zinc-500">By payment date (business timezone)</p>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">No revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#71717a"
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('en-ZA', {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(v / 100)
                  }
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenueCents"
                  name="Revenue"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Bookings over time</h2>
          <p className="mb-4 text-xs text-zinc-500">Count of paid bookings by payment date</p>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">No bookings yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" />
                <YAxis tick={{ fontSize: 11 }} stroke="#71717a" allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold text-zinc-900">Insights</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex justify-between gap-4 border-b border-zinc-50 pb-3">
              <span className="text-zinc-500">Avg booking value</span>
              <span className="font-medium text-zinc-900">
                {formatCurrency(m.avgBookingCents, false)}
              </span>
            </li>
            <li className="flex justify-between gap-4 border-b border-zinc-50 pb-3">
              <span className="text-zinc-500">7d vs prior 7d</span>
              <span
                className={cn(
                  'flex items-center gap-1 font-medium',
                  growth > 0 && 'text-emerald-700',
                  growth < 0 && 'text-red-700',
                  growth === 0 && 'text-zinc-700'
                )}
              >
                {growthIcon}
                {growth > 0 ? '+' : ''}
                {growth.toFixed(1)}%
              </span>
            </li>
            <li className="text-xs text-zinc-400">
              Last 7d: {formatCurrency(m.last7DaysRevenueCents, false)} · Prior 7d:{' '}
              {formatCurrency(m.prev7DaysRevenueCents, false)}
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900">Top services (by revenue)</h2>
          {topServices.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">No service breakdown yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100">
              {topServices.map((s) => (
                <li
                  key={s.service_type}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
                >
                  <span className="font-medium text-zinc-800">{s.service_type}</span>
                  <span className="text-sm text-zinc-500">
                    {s.count} booking{s.count === 1 ? '' : 's'} ·{' '}
                    <span className="font-medium text-zinc-900">
                      {formatCurrency(s.revenueCents, false)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Recent paid bookings</h2>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No bookings to show.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                  <th className="pb-2 pr-4 font-medium">Customer</th>
                  <th className="pb-2 pr-4 font-medium">Service</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700">
                {recent.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {b.customer_name || '—'}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">{b.service_type || '—'}</td>
                    <td className="py-2.5 pr-4">
                      {formatCurrency(Math.round(Number(b.total_amount) || 0), false)}
                    </td>
                    <td className="py-2.5 text-zinc-500">
                      {new Date(b.created_at).toLocaleString('en-ZA', {
                        timeZone: 'Africa/Johannesburg',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}
