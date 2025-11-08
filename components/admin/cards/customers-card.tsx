'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { format } from 'date-fns';

interface CustomerData {
  date: string;
  newCustomers: number;
  recurringCustomers: number;
  returningCustomers: number;
}

interface CustomersCardProps {
  data?: CustomerData[];
  newCustomers?: number;
  recurringCustomers?: number;
  returningCustomers?: number;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return format(date, 'MMM d');
  } catch {
    return dateStr;
  }
};

export function CustomersCard({
  data = [],
  newCustomers = 3724,
  recurringCustomers = 5788,
  returningCustomers = 1231,
}: CustomersCardProps) {
  // Generate sample data if none provided (30 days)
  const chartData: CustomerData[] = data.length > 0 
    ? data 
    : Array.from({ length: 30 }, (_, i) => {
        const date = new Date(2024, 0, 1 + i);
        return {
          date: date.toISOString().split('T')[0],
          newCustomers: Math.floor(Math.random() * 1400) + 200,
          recurringCustomers: Math.floor(Math.random() * 1200) + 400,
          returningCustomers: Math.floor(Math.random() * 800) + 100,
        };
      });

  // Filter dates to show at intervals (matching image)
  const intervalDates = [1, 4, 7, 10, 14, 20, 24, 28];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0]; // Show only the hovered entry
      return (
        <div className="bg-gray-800 text-white p-2 rounded text-xs border border-white">
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.name} • {formatNumber(entry.value)}</span>
          </div>
          <div className="text-gray-300">{formatDate(label)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border-0">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-gray-900">Customers</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 sm:gap-3">
            <span>Last 30 days</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid gap-2 pb-2 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">{formatNumber(newCustomers)} New customers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-600">{formatNumber(recurringCustomers)} Recurring customers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">{formatNumber(returningCustomers)} Returning customers</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                ticks={intervalDates.map(d => {
                  const date = new Date(2024, 0, d);
                  return date.toISOString().split('T')[0];
                })}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1600]}
                ticks={[0, 400, 800, 1200, 1600]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="newCustomers"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="New customers"
              />
              <Line
                type="monotone"
                dataKey="recurringCustomers"
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
                name="Recurring customers"
              />
              <Line
                type="monotone"
                dataKey="returningCustomers"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Returning customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

