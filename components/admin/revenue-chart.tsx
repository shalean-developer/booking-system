'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ChartDataPoint {
  date: string;
  revenue: number;
  bookings: number;
  completed: number;
  companyEarnings: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (dateStr: string) => {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(date, 'MMM dd');
  } catch {
    return dateStr;
  }
};

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <div className="relative">
                <BarChart3 className="h-16 w-16 text-gray-400" />
                <TrendingUp className="h-6 w-6 text-gray-300 absolute -top-1 -right-1" />
              </div>
              <div className="space-y-1">
                <p className="text-gray-700 font-medium">No revenue data available</p>
                <p className="text-sm text-gray-500 max-w-md">
                  Revenue data will appear here once bookings are created and completed. Try selecting a different date range or check back later.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[300px] pb-4">
          <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ bottom: 60, top: 10, right: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={data.length > 14 ? Math.floor(data.length / 14) : 0}
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <YAxis
              tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
              className="text-xs"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => {
                try {
                  return format(typeof label === 'string' ? parseISO(label) : new Date(label), 'MMM dd, yyyy');
                } catch {
                  return label;
                }
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              name="Total Revenue"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="companyEarnings"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Company Earnings"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
