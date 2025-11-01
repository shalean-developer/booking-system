'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Calendar, BookOpen, BarChart2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ChartDataPoint {
  date: string;
  revenue: number;
  bookings: number;
  completed: number;
  companyEarnings: number;
}

interface BookingsChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

const formatDate = (dateStr: string) => {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(date, 'MMM dd');
  } catch {
    return dateStr;
  }
};

export function BookingsChart({ data, isLoading }: BookingsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bookings Volume
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
            <Calendar className="h-5 w-5" />
            Bookings Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border-2 border-dashed border-blue-300">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <div className="relative">
                <BarChart2 className="h-16 w-16 text-blue-400" />
                <BookOpen className="h-6 w-6 text-blue-300 absolute -top-1 -right-1" />
              </div>
              <div className="space-y-1">
                <p className="text-blue-700 font-medium">No booking data available</p>
                <p className="text-sm text-blue-600 max-w-md">
                  Booking trends will appear here once bookings are created in the selected period. Try adjusting the date range filter above.
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
          <Calendar className="h-5 w-5" />
          Bookings Volume
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[300px] pb-4">
          <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ bottom: 60, top: 10, right: 10, left: 10 }}>
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
            <YAxis className="text-xs" tick={{ fontSize: 11 }} stroke="#6b7280" />
            <Tooltip
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
            <Bar dataKey="bookings" fill="#3b82f6" name="Total Bookings" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
