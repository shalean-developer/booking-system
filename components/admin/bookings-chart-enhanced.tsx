'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { formatDateShort } from '@/lib/utils/formatting';

const BookingsChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = mod;
    
    return function BookingsChartComponent({ data, isLoading }: { data: ChartDataPoint[]; isLoading?: boolean }) {
      if (isLoading || !data || data.length === 0) {
        return (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            {isLoading ? 'Loading...' : 'No data available'}
          </div>
        );
      }

      // Transform data for the chart
      const chartData = data.map((item) => ({
        date: item.date || '',
        bookings: item.bookings || 0,
      }));

      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(value) => (value ? formatDateShort(value) : '')}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [value, 'Bookings']}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Bar 
              dataKey="bookings" 
              fill="#10b981" 
              name="Bookings"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded" /> }
);

import type { ChartDataPoint } from '@/types/admin-dashboard';

export interface BookingsChartEnhancedProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

export function BookingsChartEnhanced({ data, isLoading }: BookingsChartEnhancedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <BookingsChart data={data} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

