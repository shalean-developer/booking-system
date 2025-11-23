'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const BookingsChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = mod;
    
    return function BookingsChartComponent({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
      if (isLoading || !data || data.length === 0) {
        return (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            {isLoading ? 'Loading...' : 'No data available'}
          </div>
        );
      }

      // Transform data for the chart
      const chartData = data.map((item: any) => ({
        date: item.date || item.period || item.label || '',
        bookings: item.bookings || item.count || item.value || 0,
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

export interface BookingsChartEnhancedProps {
  data: any[];
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

