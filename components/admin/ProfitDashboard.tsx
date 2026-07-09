'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { fetcher } from '@/lib/swr-config';
import { ProfitChart, type ProfitChartPoint } from '@/components/admin/ProfitChart';
import { BookingsProfitTable, type BookingProfitRow } from '@/components/admin/BookingsProfitTable';

type ProfitApiResponse = {
  ok: boolean;
  error?: string;
  totalRevenue?: number;
  totalCost?: number;
  totalProfit?: number;
  avgMargin?: number;
  bookings?: BookingProfitRow[];
  chartData?: ProfitChartPoint[];
};

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">{value}</p>
    </div>
  );
}

function buildInsights(rows: BookingProfitRow[], avgMargin: number) {
  const byService = new Map<string, { profit: number; revenue: number; n: number }>();
  for (const b of rows) {
    const st = (b.service_type || 'Unknown').trim() || 'Unknown';
    const cur = byService.get(st) ?? { profit: 0, revenue: 0, n: 0 };
    cur.profit += Number(b.profit_zar) || 0;
    cur.revenue += Number(b.revenue_zar) || 0;
    cur.n += 1;
    byService.set(st, cur);
  }

  let highestProfitService = '—';
  let maxProfit = -Infinity;
  let lowestMarginService = '—';
  let minMargin = Infinity;

  for (const [st, v] of byService) {
    if (v.profit > maxProfit) {
      maxProfit = v.profit;
      highestProfitService = st;
    }
    const m = v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0;
    if (v.n > 0 && m < minMargin) {
      minMargin = m;
      lowestMarginService = st;
    }
  }

  return {
    highestProfitService,
    lowestMarginService,
    avgMarginLabel: Number.isFinite(avgMargin) ? `${avgMargin.toFixed(1)}%` : '—',
  };
}

export function ProfitDashboard() {
  const searchParams = useSearchParams();
  const q = searchParams.toString();
  const key = `/api/admin/analytics/profit${q ? `?${q}` : ''}`;
  const { data, error, isLoading } = useSWR<ProfitApiResponse>(key, fetcher);

  const rows = data?.bookings ?? [];
  const chartData = data?.chartData ?? [];

  const insights = useMemo(() => {
    const am = data?.avgMargin ?? 0;
    return buildInsights(rows, am);
  }, [rows, data?.avgMargin]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading profit analytics…
      </div>
    );
  }

  if (error || !data?.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {data?.error || (error instanceof Error ? error.message : 'Failed to load profit data')}
      </div>
    );
  }

  const totalRevenue = data.totalRevenue ?? 0;
  const totalCost = data.totalCost ?? 0;
  const totalProfit = data.totalProfit ?? 0;
  const avgMargin = data.avgMargin ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Payment-locked profit</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Revenue from pricing snapshot at payment; cost = duration × cleaner hourly rate. No client
          totals.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat title="Revenue" value={`R ${totalRevenue.toLocaleString('en-ZA')}`} />
        <Stat title="Cleaner cost" value={`R ${totalCost.toLocaleString('en-ZA')}`} />
        <Stat title="Profit" value={`R ${totalProfit.toLocaleString('en-ZA')}`} />
        <Stat title="Avg margin" value={`${avgMargin.toFixed(1)}%`} />
      </div>

      <ProfitChart data={chartData} />

      <BookingsProfitTable data={rows} />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80">
        <div className="text-sm font-semibold text-zinc-900">Insights</div>
        <ul className="mt-2 space-y-1 text-sm text-zinc-600">
          <li>
            Highest total profit (range):{' '}
            <span className="font-medium text-zinc-900">{insights.highestProfitService}</span>
          </li>
          <li>
            Lowest margin service (range):{' '}
            <span className="font-medium text-zinc-900">{insights.lowestMarginService}</span>
          </li>
          <li>
            Average margin:{' '}
            <span className="font-medium text-zinc-900">{insights.avgMarginLabel}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
