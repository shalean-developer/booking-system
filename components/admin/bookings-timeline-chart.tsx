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

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">Bookings Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  try {
                    return format(parseISO(value), 'EEE');
                  } catch {
                    return value;
                  }
                }}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => {
                  try {
                    return format(parseISO(value), 'MMM d, yyyy');
                  } catch {
                    return value;
                  }
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Total Bookings"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2}
                name="Completed"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                stroke="#ef4444"
                strokeWidth={2}
                name="Cancelled"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-600 mb-1">Total Bookings</div>
              <div className="text-lg font-semibold text-gray-900">{totalBookings}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Completed</div>
              <div className="text-lg font-semibold text-green-600">{totalCompleted}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Cancelled</div>
              <div className="text-lg font-semibold text-red-600">{totalPending}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

