'use client';

import { cn } from '@/lib/utils';

export type BookingProfitRow = {
  id: string;
  created_at: string | null;
  booking_date: string | null;
  service_type: string | null;
  revenue_zar: number | null;
  cleaner_cost_zar: number | null;
  profit_zar: number | null;
  margin_percent: number | null;
};

function fmtZar(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `R ${Math.round(Number(n)).toLocaleString('en-ZA')}`;
}

function fmtMargin(p: number | null | undefined) {
  if (p == null || !Number.isFinite(Number(p))) return '—';
  return `${Number(p).toFixed(1)}%`;
}

function marginClass(m: number | null | undefined): string {
  if (m == null || !Number.isFinite(Number(m))) return 'text-zinc-600';
  if (m < 20) return 'text-red-500 font-medium';
  if (m < 40) return 'text-yellow-600 font-medium';
  return 'text-green-600 font-medium';
}

export function BookingsProfitTable({ data }: { data: BookingProfitRow[] }) {
  if (!data.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center text-sm text-zinc-500">
        No paid bookings with locked profit in this range yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/90">
            <th className="px-4 py-3 font-semibold text-zinc-700">Date</th>
            <th className="px-4 py-3 font-semibold text-zinc-700">Service</th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-700">Revenue</th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-700">Cost</th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-700">Profit</th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-700">Margin</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const dateStr =
              row.booking_date && row.booking_date.length >= 10
                ? row.booking_date.slice(0, 10)
                : row.created_at && row.created_at.length >= 10
                  ? row.created_at.slice(0, 10)
                  : '—';
            const m = row.margin_percent != null ? Number(row.margin_percent) : null;
            return (
              <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-2.5 tabular-nums text-zinc-800">{dateStr}</td>
                <td className="max-w-[180px] truncate px-4 py-2.5 text-zinc-700">
                  {row.service_type ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-800">
                  {fmtZar(row.revenue_zar)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-800">
                  {fmtZar(row.cleaner_cost_zar)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-800">
                  {fmtZar(row.profit_zar)}
                </td>
                <td className={cn('px-4 py-2.5 text-right tabular-nums', marginClass(m))}>
                  {fmtMargin(m)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
