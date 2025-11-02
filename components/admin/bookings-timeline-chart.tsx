'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface BookingsTimelineData {
  date: string;
  bookings: number;
  completed: number;
  cancelled: number;
}

interface BookingsTimelineChartProps {
  data: BookingsTimelineData[];
  totalBookings: number;
  totalCompleted: number;
  totalPending: number;
}

export function BookingsTimelineChart({
  data,
  totalBookings,
  totalCompleted,
  totalPending,
}: BookingsTimelineChartProps) {
  // Ensure we have data
  const chartData = data.length > 0 ? data : [
    { date: new Date().toISOString().slice(0, 10), bookings: 0, completed: 0, cancelled: 0 }
  ];
  
  // Calculate interval for x-axis labels to prevent crowding
  // Show approximately 7-10 labels regardless of data length
  const labelInterval = chartData.length > 14 
    ? Math.floor(chartData.length / 8) 
    : chartData.length > 7 
    ? Math.floor(chartData.length / 5)
    : 0;

  return (
    <Card className="bg-white rounded-xl shadow-card border border-gray-200 hover:shadow-card-hover transition-shadow duration-300">
      <CardHeader className="pb-2 px-6 pt-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Bookings Timeline</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4 pt-0">
        <div>
          {/* Chart */}
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  try {
                    return format(parseISO(value), 'EEE');
                  } catch {
                    return value;
                  }
                }}
                interval={labelInterval}
                angle={-45}
                textAnchor="end"
                height={50}
                stroke="#6b7280"
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelFormatter={(value) => {
                  try {
                    return format(parseISO(value), 'MMM d, yyyy');
                  } catch {
                    return value;
                  }
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '4px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                stroke="#ef4444"
                strokeWidth={2.5}
                name="Cancelled"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2.5}
                name="Completed"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Total Bookings"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 mt-2">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wide">Total Bookings</div>
              <div className="text-lg font-bold text-gray-900">{totalBookings}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wide">Completed</div>
              <div className="text-lg font-bold text-green-600">{totalCompleted}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wide">Cancelled</div>
              <div className="text-lg font-bold text-red-600">{totalPending}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

