'use client';

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

export type ProfitChartPoint = {
  date: string;
  revenue_zar: number;
  profit_zar: number;
};

export function ProfitChart({ data }: { data: ProfitChartPoint[] }) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-12 text-center text-sm text-zinc-500">
        No time-series data for this range (paid bookings with locked profit).
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full rounded-xl border border-zinc-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-zinc-500" />
          <YAxis
            tick={{ fontSize: 11 }}
            className="text-zinc-500"
            tickFormatter={(v) => `R${Math.round(v)}`}
          />
          <Tooltip
            formatter={(value, name) => {
              const v = value ?? 0;
              return [
                `R ${typeof v === 'number' ? Math.round(v).toLocaleString('en-ZA') : String(v)}`,
                name === 'profit_zar' ? 'Profit' : 'Revenue',
              ];
            }}
            labelFormatter={(label) => String(label)}
            contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue_zar"
            name="Revenue"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="profit_zar"
            name="Profit"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
